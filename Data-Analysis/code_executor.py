import re
import io
import time
import traceback
import numpy as np
import pandas as pd
from typing import Tuple, Any, Dict, List
from contextlib import redirect_stdout, redirect_stderr

class CodeExecutor:
    def __init__(self):
        pass
        
    
    def execute_code(self, code: str, df: pd.DataFrame) -> Tuple[pd.DataFrame, str]:
        start_time = time.time()
        
        try:
            # No security validation - allow any code
            result_df, execution_log = self._execute_code(code, df)
            
            execution_time = time.time() - start_time
            execution_log += f"\nExecution time: {execution_time:.3f}s"
            
            return result_df, execution_log
            
        except Exception as e:
            execution_time = time.time() - start_time
            error_log = f"Execution failed after {execution_time:.3f}s\n"
            error_log += f"Error: {str(e)}\n"
            error_log += f"Traceback:\n{traceback.format_exc()}"
            return df, error_log
    
    def execute_query_code(self, code: str, df: pd.DataFrame) -> Tuple[str, str]:
        """Execute query code and return the output string and execution log"""
        try:
            globals_dict = {
                'df': df.copy(),
                'pd': pd,
                'np': np,
                'pandas': pd,
                'numpy': np
            }
            locals_dict = {'df': df.copy()}
            
            stdout_capture = io.StringIO()
            stderr_capture = io.StringIO()
            
            with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
                exec(code, globals_dict, locals_dict)
            
            stdout_content = stdout_capture.getvalue()
            stderr_content = stderr_capture.getvalue()
            
            execution_log = ""
            if stderr_content:
                execution_log += f"Warnings:\n{stderr_content}\n"
            
            return stdout_content.strip(), execution_log
            
        except Exception as e:
            error_log = f"Error: {str(e)}\nTraceback:\n{traceback.format_exc()}"
            print(f"ERROR: {str(e)}")
            traceback.print_exc()
            return "", error_log
    
    
    def _execute_code(self, code: str, df: pd.DataFrame) -> Tuple[pd.DataFrame, str]:
        # No restrictions - allow any code
        globals_dict = {
            'df': df.copy(),
            'pd': pd,
            'np': np,
            'pandas': pd,
            'numpy': np
        }
        locals_dict = {'df': df.copy()}
        
        stdout_capture = io.StringIO()
        stderr_capture = io.StringIO()
        
        with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
            exec(code, globals_dict, locals_dict)
        
        result = locals_dict.get('df', df)
        
        stdout_content = stdout_capture.getvalue()
        stderr_content = stderr_capture.getvalue()
        
        execution_log = ""
        if stdout_content:
            execution_log += f"Output:\n{stdout_content}\n"
        if stderr_content:
            execution_log += f"Warnings:\n{stderr_content}\n"
        
        if not execution_log:
            execution_log = "Code executed successfully with no output."
        
        return result, execution_log
    

    

    
    
    