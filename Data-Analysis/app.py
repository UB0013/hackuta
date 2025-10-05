import io
import pandas as pd
from flask import Flask, request, jsonify, send_from_directory, render_template_string
from flask_cors import CORS
from werkzeug.utils import secure_filename
from chat_agent import ChatAgent, ConversationState
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Configure upload settings
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
ALLOWED_EXTENSIONS = {'xlsx', 'xls', 'csv'}

current_dataframe: pd.DataFrame = None
# Maintain full history stacks for robust undo/redo
undo_stack: list[pd.DataFrame] = []
redo_stack: list[pd.DataFrame] = []

conversation_state = ConversationState()
chat_agent = ChatAgent()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def safe_to_dict(df: pd.DataFrame, orient='records'):
    df_clean = df.copy()
    df_clean = df_clean.where(pd.notnull(df_clean), None)
    return df_clean.to_dict(orient)

@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files"""
    return send_from_directory('static', filename)

@app.route('/build/<path:filepath>')
def serve_build_files(filepath):
    """Serve React build files for the widget"""
    return send_from_directory('build', filepath)

@app.route('/dashboard')
def dashboard():
    """Serve the dashboard HTML with embedded widget"""
    return send_from_directory('static', 'index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    global current_dataframe, undo_stack, redo_stack
    
    if 'file' not in request.files:
        return jsonify({'detail': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'detail': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'detail': 'Only Excel and CSV files are supported'}), 400
    
    try:
        filename = secure_filename(file.filename)
        
        if filename.endswith('.csv'):
            current_dataframe = pd.read_csv(file)
        else:
            current_dataframe = pd.read_excel(file)
        
        # reset history stacks on new upload
        undo_stack = []
        redo_stack = []
        
        return jsonify({
            "message": "File uploaded successfully",
            "filename": filename,
            "shape": current_dataframe.shape,
            "columns": list(current_dataframe.columns),
            "preview": safe_to_dict(current_dataframe.head(100)),
            "total_rows": len(current_dataframe),
            "undo_count": len(undo_stack),
            "redo_count": len(redo_stack),
        })
    except Exception as e:
        return jsonify({'detail': f'Error processing file: {str(e)}'}), 400

@app.route('/undo', methods=['POST'])
def undo_last_transformation():
    global current_dataframe, undo_stack, redo_stack
    if not undo_stack:
        return jsonify({
            "success": False,
            "error": "Nothing to undo",
            "undo_count": len(undo_stack),
            "redo_count": len(redo_stack),
        })

    print("Undo requested - restoring previous dataframe from stack")
    # move current to redo, pop last undo into current
    if current_dataframe is not None:
        redo_stack.append(current_dataframe)
    current_dataframe = undo_stack.pop()

    current_dataframe.to_csv('data.csv', index=False)
    print("Previous df restored and saved to data.csv file")

    return jsonify({
        "success": True,
        "type": "transformation",
        "message": "Successfully undone last transformation",
        "result_shape": current_dataframe.shape,
        "result_columns": list(current_dataframe.columns),
        "preview": safe_to_dict(current_dataframe.head(100)),
        "total_rows": len(current_dataframe),
        "undo_count": len(undo_stack),
        "redo_count": len(redo_stack),
    })

@app.route('/redo', methods=['POST'])
def redo_last_undo():
    global current_dataframe, undo_stack, redo_stack
    if not redo_stack:
        return jsonify({
            "success": False,
            "error": "Nothing to redo",
            "undo_count": len(undo_stack),
            "redo_count": len(redo_stack),
        })

    print("Redo requested - re-applying last undone dataframe from stack")
    # move current to undo, pop last redo into current
    if current_dataframe is not None:
        undo_stack.append(current_dataframe)
        if len(undo_stack) > 50:
            undo_stack.pop(0)
    current_dataframe = redo_stack.pop()

    current_dataframe.to_csv('data.csv', index=False)

    return jsonify({
        "success": True,
        "type": "transformation",
        "message": "Successfully redone last undo",
        "result_shape": current_dataframe.shape,
        "result_columns": list(current_dataframe.columns),
        "preview": safe_to_dict(current_dataframe.head(100)),
        "total_rows": len(current_dataframe),
        "undo_count": len(undo_stack),
        "redo_count": len(redo_stack),
    })

@app.route('/chat', methods=['POST'])
def chat_with_agent():
    global current_dataframe, conversation_state, undo_stack, redo_stack
    try:
        data = request.get_json()
        message = data.get('message', '')
        model = data.get('model', 'gemini')
        
        # record user message
        conversation_state.messages.append({
            'role': 'user',
            'content': message,
            'timestamp': datetime.now().isoformat()
        })

        # get assistant response
        response = chat_agent.chat(
            message,
            conversation_state.messages,
            current_dataframe,
            model
        )

        # record assistant message
        conversation_state.messages.append({
            'role': 'assistant',
            'content': response['message'],
            'code': response.get('code'),
            'timestamp': datetime.now().isoformat()
        })

        dataframe_updated = False
        if response.get('has_code') and response.get('execution_result'):
            execution_result = response['execution_result']
            if execution_result.get('success'):
                # push current to undo stack and clear redo
                if current_dataframe is not None:
                    undo_stack.append(current_dataframe.copy())
                    if len(undo_stack) > 50:
                        undo_stack.pop(0)
                redo_stack = []

                current_dataframe = execution_result['dataframe']
                current_dataframe.to_csv('data.csv', index=False)
                dataframe_updated = True

        # sanitize execution_result for response
        safe_execution_result = None
        if response.get('execution_result') is not None:
            er = dict(response['execution_result'])
            if 'dataframe' in er:
                er.pop('dataframe', None)
            if isinstance(er.get('original_shape'), (list, tuple)):
                er['original_shape'] = [int(x) for x in er['original_shape']]
            if isinstance(er.get('new_shape'), (list, tuple)):
                er['new_shape'] = [int(x) for x in er['new_shape']]
            if 'execution_log' in er and er['execution_log'] is not None:
                er['execution_log'] = str(er['execution_log'])
            if 'error' in er and er['error'] is not None:
                er['error'] = str(er['error'])
            safe_execution_result = er

        return jsonify({
            'success': True,
            'message': response['message'],
            'dataframe_updated': dataframe_updated,
            'raw_response': response.get('raw_response'),
            'executed_code': response.get('executed_code'),
            'execution_result': safe_execution_result,
            'undo_count': len(undo_stack),
            'redo_count': len(redo_stack),
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/data')
def get_data_page():
    global current_dataframe, undo_stack, redo_stack
    if current_dataframe is None:
        return jsonify({'detail': 'No data available'}), 400

    page = int(request.args.get('page', 1))
    rows_per_page = int(request.args.get('rows_per_page', 10))
    
    total_rows = len(current_dataframe)
    total_pages = (total_rows + rows_per_page - 1) // rows_per_page
    if total_pages == 0:
        total_pages = 1
    if page < 1 or page > total_pages:
        return jsonify({'detail': f'Invalid page number. Must be between 1 and {total_pages}'}), 400

    start_idx = (page - 1) * rows_per_page
    end_idx = min(start_idx + rows_per_page, total_rows)
    page_data = current_dataframe.iloc[start_idx:end_idx]

    return jsonify({
        "data": safe_to_dict(page_data),
        "columns": list(current_dataframe.columns),
        "current_page": page,
        "total_pages": total_pages,
        "total_rows": total_rows,
        "rows_per_page": rows_per_page,
        "start_row": start_idx + 1,
        "end_row": end_idx,
        "undo_count": len(undo_stack),
        "redo_count": len(redo_stack),
    })

@app.route('/chat/history')
def get_chat_history():
    global conversation_state
    return jsonify({
        'messages': conversation_state.messages[-20:],
        'total_messages': len(conversation_state.messages)
    })

@app.route('/chat/clear', methods=['POST'])
def clear_chat_history():
    global conversation_state
    conversation_state.messages = []
    return jsonify({'success': True, 'message': 'Chat history cleared'})

@app.route('/')
def landing_page():
    """Serve the React landing page"""
    return send_from_directory('templates', 'landing.html')

@app.route('/app')
def dashboard_app():
    """Serve the dashboard (alternative route)"""
    return send_from_directory('static', 'index.html')

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)