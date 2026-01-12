"""
自动任务日志系统

拦截 LangGraph 的日志，为每个 run 自动创建独立日志文件
不需要修改 LangGraph 内部代码，完全透明
"""

import sys
import os
from datetime import datetime
from pathlib import Path
from collections import defaultdict


class AutoTaskLogger:
    """自动为每个 LangGraph run 创建日志文件"""
    
    def __init__(self, project_root: str = None):
        if project_root is None:
            # 自动检测项目根目录
            current_file = Path(__file__).resolve()
            project_root = current_file.parent.parent
        
        self.project_root = Path(project_root)
        self.task_logs_dir = self.project_root / "task_logs"
        self.task_logs_dir.mkdir(exist_ok=True)
        
        # 存储每个 run_id 的日志文件
        self.run_logs = {}
        
        # 存储每个 run 的起始时间
        self.run_start_times = {}
        
        # 原始的 stdout/stderr
        self.original_stdout = sys.stdout
        self.original_stderr = sys.stderr
        
        # 当前写入的 run_id
        self.current_run_id = None
        
        print(f"✅ 自动任务日志系统已启用")
        print(f"   日志目录: {self.task_logs_dir}")
    
    def extract_run_id_from_line(self, line: str) -> str:
        """从日志行中提取 run_id"""
        # LangGraph 日志格式: [...] run_id=019bad70-0b68-737f-8e9e-43dec7f4f47f
        if 'run_id=' in line:
            start = line.find('run_id=')
            if start != -1:
                start += 7  # len('run_id=')
                # 找到空格或行尾
                end = line.find(' ', start)
                if end == -1:
                    end = line.find('\x1b', start)  # ANSI 转义符
                if end == -1:
                    end = len(line)
                run_id = line[start:end].strip()
                return run_id
        return None
    
    def get_or_create_log_file(self, run_id: str):
        """获取或创建 run 的日志文件"""
        if run_id not in self.run_logs:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            short_run_id = run_id[:8]
            log_filename = f"task_{timestamp}_{short_run_id}.log"
            log_path = self.task_logs_dir / log_filename
            
            log_file = open(log_path, 'w', encoding='utf-8', buffering=1)
            
            self.run_logs[run_id] = {
                'file': log_file,
                'path': log_path
            }
            self.run_start_times[run_id] = datetime.now()
            
            # 写入日志头
            log_file.write("=" * 80 + "\n")
            log_file.write(f"自动任务日志 - Run ID: {run_id}\n")
            log_file.write(f"开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            log_file.write(f"日志文件: {log_path}\n")
            log_file.write("=" * 80 + "\n\n")
            
            # 输出到控制台
            self.original_stdout.write(f"\n📝 任务日志自动创建: {log_path}\n")
            self.original_stdout.flush()
        
        return self.run_logs[run_id]
    
    def close_run_log(self, run_id: str):
        """关闭 run 的日志文件"""
        if run_id in self.run_logs:
            log_entry = self.run_logs[run_id]
            
            # 写入日志尾
            log_entry['file'].write("\n" + "=" * 80 + "\n")
            log_entry['file'].write(f"任务完成: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            
            if run_id in self.run_start_times:
                duration = datetime.now() - self.run_start_times[run_id]
                log_entry['file'].write(f"耗时: {duration.total_seconds():.2f}s\n")
            
            log_entry['file'].write(f"日志保存至: {log_entry['path']}\n")
            log_entry['file'].write("=" * 80 + "\n")
            
            log_entry['file'].close()
            
            # 输出到控制台
            self.original_stdout.write(f"✅ 任务日志已保存: {log_entry['path']}\n")
            if run_id in self.run_start_times:
                duration = datetime.now() - self.run_start_times[run_id]
                self.original_stdout.write(f"   耗时: {duration.total_seconds():.2f}s\n")
            self.original_stdout.flush()
            
            del self.run_logs[run_id]
            if run_id in self.run_start_times:
                del self.run_start_times[run_id]
    
    def write_to_run_log(self, line: str):
        """将日志行写入对应的 run 日志文件"""
        # 提取 run_id
        run_id = self.extract_run_id_from_line(line)
        
        if run_id:
            # 更新当前 run_id
            self.current_run_id = run_id
            
            # 获取或创建日志文件
            log_entry = self.get_or_create_log_file(run_id)
            
            # 写入日志
            log_entry['file'].write(line)
            
            # 检查是否是任务结束标记
            if 'Background run succeeded' in line or 'Background run failed' in line:
                self.close_run_log(run_id)
                self.current_run_id = None
        
        elif self.current_run_id:
            # 如果没有 run_id 但有当前上下文，继续写入
            if self.current_run_id in self.run_logs:
                self.run_logs[self.current_run_id]['file'].write(line)
    
    def start(self):
        """启动日志拦截"""
        # 创建一个包装器来拦截 stdout
        class LogInterceptor:
            def __init__(self, original, logger):
                self.original = original
                self.logger = logger
            
            def write(self, text):
                # 写入原始输出
                self.original.write(text)
                self.original.flush()
                
                # 同时写入任务日志
                if text and text.strip():
                    self.logger.write_to_run_log(text)
            
            def flush(self):
                self.original.flush()
            
            def __getattr__(self, name):
                return getattr(self.original, name)
        
        # 替换 stdout 和 stderr
        sys.stdout = LogInterceptor(self.original_stdout, self)
        sys.stderr = LogInterceptor(self.original_stderr, self)


# 全局实例
_auto_logger = None


def setup_auto_task_logging(project_root: str = None):
    """设置自动任务日志系统"""
    global _auto_logger
    
    if _auto_logger is None:
        _auto_logger = AutoTaskLogger(project_root)
        _auto_logger.start()

