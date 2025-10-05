import google.generativeai as genai
import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import datetime
import re
from code_executor import CodeExecutor

class ConversationState:
    def __init__(self):
        self.messages = []
        self.dataframe = None
        self.dataframe_history = []

class ChatAgent:
    def __init__(self):
        api_key = "AIzaSyCcEOYX8bnkiC6uuhz3yGQ8Uq00z0Z2YCs"
        genai.configure(api_key=api_key)
        self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
        
        self.code_executor = CodeExecutor()
        
    def _get_model_response(self, context: str, message: str, model_type: str = "gemini") -> str:
        full_prompt = f"{context}\n\nUSER: {message}\nASSISTANT:"
        return self._get_gemini_response(full_prompt)
    

    
    def _get_gemini_response(self, full_prompt: str) -> str:
        try:
            response = self.gemini_model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=1000,
                )
            )
            
            if hasattr(response, 'text') and response.text:
                return response.text
            elif hasattr(response, 'candidates') and response.candidates:
                for candidate in response.candidates:
                    if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                        for part in candidate.content.parts:
                            if hasattr(part, 'text') and part.text:
                                return part.text
                return "I couldn't generate a proper response. The API returned candidates but no usable text."
            else:
                return "I couldn't generate a response. Please try again."
                
        except Exception as e:
            print(f"ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            return f"Sorry, I encountered an error with Gemini: {str(e)}"
    
    def chat(self, message: str, conversation_history: List[Dict], df: pd.DataFrame = None, model_type: str = "gemini") -> Dict:
        # 1) Log user message
        print("-" * 50)
        print("USER MESSAGE:", message)
        print("-" * 50)
        
        try:
            context = self._build_conversation_context(conversation_history, df)
            response = self._get_model_response(context, message, model_type)
            
            # 2) Log Gemini response
            print("GEMINI RESPONSE:", response)
            print("-" * 50)
        except Exception as e:
            # 3) Log error if any
            print("ERROR:", str(e))
            print("-" * 50)
            import traceback
            traceback.print_exc()
            return {
                'message': f"Sorry, I encountered an error: {str(e)}",
                'has_code': False,
                'raw_response': f"Error: {str(e)}",
            }
        
        try:
            # Extract ALL code blocks from the response
            code_blocks = self._extract_all_code_blocks(response)
            
            if code_blocks:
                all_outputs = []
                has_transformation = False
                current_df = df
                
                # Execute all code blocks sequentially
                for i, (code, is_query) in enumerate(code_blocks):
                    print(f"EXECUTING CODE BLOCK {i+1} ({'QUERY' if is_query else 'TRANSFORMATION'}):")
                    
                    execution_result = self._execute_code_safely(code, current_df, is_query=is_query)
                    
                    # Log execution result
                    if execution_result.get('success'):
                        if is_query and execution_result.get('output'):
                            print("EXECUTION RESULT:", execution_result['output'])
                            all_outputs.append(execution_result['output'])
                        elif not is_query:
                            print("EXECUTION RESULT: Data transformation completed successfully")
                            # Update dataframe for next code block
                            if execution_result.get('dataframe') is not None:
                                current_df = execution_result['dataframe']
                            has_transformation = True
                            # Add confirmation message for transformations
                            all_outputs.append("✓ Done!")
                    else:
                        error_msg = execution_result.get('error', 'Unknown error')
                        print("EXECUTION RESULT: Failed -", error_msg)
                        all_outputs.append(f"Error: {error_msg}")
                    
                    print("-" * 30)
                
                print("-" * 50)
                
                # Extract user message (everything before first code block)
                user_message = self._extract_user_message_from_response(response)
                
                # Combine message with all outputs
                if all_outputs:
                    outputs_text = "\n\n".join(all_outputs)
                    final_message = f"{user_message}\n\n{outputs_text}"
                else:
                    final_message = user_message
                
                return {
                    'message': final_message,
                    'has_code': has_transformation,
                    'execution_result': {'success': True, 'dataframe': current_df} if has_transformation else None,
                    'raw_response': response,
                    'executed_code': '; '.join([code for code, _ in code_blocks])
                }
            else:
                return {
                    'message': response,
                    'has_code': False,
                    'raw_response': response,
                }
        except Exception as e:
            # 3) Log error if any
            print("ERROR:", str(e))
            print("-" * 50)
            import traceback
            traceback.print_exc()
            return {
                'message': f"Sorry, I encountered an error: {str(e)}",
                'has_code': False,
                'raw_response': f"Error: {str(e)}",
            }
            

    
    def _build_conversation_context(self, history: List[Dict], df: pd.DataFrame) -> str:
        df_info = self._get_dataframe_info(df) if df is not None else "No data loaded"
        
        system_prompt = f"""You are a conversational data analyst assistant helping a business user with their data.

CURRENT DATAFRAME INFO:
{df_info}

IMPORTANT: You MUST answer ALL questions by querying the actual dataframe data. Never make assumptions or give generic answers.

CONVERSATION RULES:
1. Give DIRECT, NATURAL responses - don't mention technical steps or "I'll do this and that"
2. For ANY question about the data, use <query_code> to get the actual answer
3. For data transformations, use <execute_code> to modify the dataframe
4. When user asks multiple steps, execute them all but give a simple final answer
5. Don't explain what you're doing - just give the result the user wants
6. Be conversational but focus on the actual answer, not the process

CODE GENERATION RULES:
1. You can write ANY Python code - no restrictions
2. The DataFrame is available as 'df'
3. For queries: Use <query_code> tags and include print() statements to show results
4. For transformations: Use <execute_code> tags to modify 'df' in-place or reassign it
5. You can import ANY modules you need (pandas, numpy, matplotlib, seaborn, etc.)
6. You can use ANY Python functions and libraries
7. Always include print() statements in queries to show results to the user

EXAMPLES:

User: "Who has the highest score?"
Response: "Emma Lopez has the highest score with 83.50."
<query_code>
top_student = df.loc[df['Total_Score'].idxmax()]
print(top_student['Student_Name'] + " has the highest score with " + str(round(top_student['Total_Score'], 2)) + ".")
</query_code>

User: "Sort by score ascending"
Response: "Done! The data is now sorted by score in ascending order."
<execute_code>
df = df.sort_values(by='Total_Score', ascending=True)
</execute_code>

For multi-step requests: Execute all steps, then give the final answer directly.

CONVERSATION HISTORY:
"""
        
        recent_history = history[-10:] if len(history) > 10 else history
        for msg in recent_history:
            role = msg['role'].upper()
            content = msg['content']
            system_prompt += f"\n{role}: {content}"
            if msg.get('code'):
                system_prompt += f"\n[EXECUTED CODE: {msg['code']}]"
        
        return system_prompt
    
    def _contains_code_execution(self, response: str) -> bool:
        return ("<execute_code>" in response and "</execute_code>" in response)
    
    def _contains_query_code(self, response: str) -> bool:
        return ("<query_code>" in response and "</query_code>" in response)
    
    def _extract_code_from_response(self, response: str) -> str:
        try:
            if "<execute_code>" in response:
                start = response.find("<execute_code>") + len("<execute_code>")
                end = response.find("</execute_code>")
                return response[start:end].strip()
            return ""
        except:
            return ""
    
    def _extract_query_code_from_response(self, response: str) -> str:
        try:
            if "<query_code>" in response:
                start = response.find("<query_code>") + len("<query_code>")
                end = response.find("</query_code>")
                return response[start:end].strip()
            return ""
        except:
            return ""
    
    def _extract_user_message_from_response(self, response: str, code_type: str = 'execute_code') -> str:
        try:
            # Find the first code block (either type)
            execute_start = response.find("<execute_code>")
            query_start = response.find("<query_code>")
            
            # Get the earliest code block position
            code_positions = [pos for pos in [execute_start, query_start] if pos != -1]
            if code_positions:
                first_code_start = min(code_positions)
                return response[:first_code_start].strip()
            
            return response
        except:
            return response
    
    def _extract_all_code_blocks(self, response: str) -> List[tuple]:
        """Extract all code blocks from response in order. Returns list of (code, is_query) tuples."""
        code_blocks = []
        
        # Find all execute_code blocks
        pos = 0
        while True:
            start_tag = response.find("<execute_code>", pos)
            if start_tag == -1:
                break
            end_tag = response.find("</execute_code>", start_tag)
            if end_tag == -1:
                break
            
            code = response[start_tag + len("<execute_code>"):end_tag].strip()
            code_blocks.append((start_tag, code, False))  # False = not query
            pos = end_tag + len("</execute_code>")
        
        # Find all query_code blocks
        pos = 0
        while True:
            start_tag = response.find("<query_code>", pos)
            if start_tag == -1:
                break
            end_tag = response.find("</query_code>", start_tag)
            if end_tag == -1:
                break
            
            code = response[start_tag + len("<query_code>"):end_tag].strip()
            code_blocks.append((start_tag, code, True))  # True = is query
            pos = end_tag + len("</query_code>")
        
        # Sort by position in response to maintain order
        code_blocks.sort(key=lambda x: x[0])
        
        # Return just (code, is_query) tuples
        return [(code, is_query) for _, code, is_query in code_blocks]

    def _execute_code_safely(self, code: str, df: pd.DataFrame, is_query: bool = False) -> Dict:
        if not code or df is None:
            return {'success': False, 'error': 'No code or dataframe provided'}
        
        try:
            if is_query:
                output, execution_log = self.code_executor.execute_query_code(code, df)
                execution_failed = any(error_word in execution_log.lower() for error_word in 
                                     ['error:', 'failed', 'traceback', 'exception', 'keyerror', 'nameerror'])
                
                if execution_failed:
                    return {'success': False, 'error': execution_log}
                
                return {'success': True, 'output': output, 'execution_log': execution_log}
            else:
                result_df, execution_log = self.code_executor.execute_code(code, df)
                execution_failed = any(error_word in execution_log.lower() for error_word in 
                                     ['error:', 'failed', 'traceback', 'exception', 'keyerror', 'nameerror'])
                
                if execution_failed:
                    return {'success': False, 'error': execution_log, 'dataframe': df}
                
                return {
                    'success': True,
                    'dataframe': result_df,
                    'execution_log': execution_log,
                    'original_shape': list(df.shape),
                    'new_shape': list(result_df.shape)
                }
        except Exception as e:
            print("ERROR:", str(e))
            print("-" * 50)
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': f"Exception: {str(e)}",
                'dataframe': df if not is_query else None
            }
    
    def _get_dataframe_info(self, df: pd.DataFrame) -> str:
        dtypes_dict = {}
        for col, dtype in df.dtypes.items():
            dtypes_dict[str(col)] = str(dtype)
        
        return f"""
- Shape: {df.shape}
- Columns: {list(df.columns)}
- Data types: {dtypes_dict}
- Sample data (first 3 rows):
{df.head(3).to_string()}
"""