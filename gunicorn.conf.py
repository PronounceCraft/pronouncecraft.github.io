# Server Socket
bind = "0.0.0.0:5001"

# Worker Processes
workers = 4  # (2 * num_cores) + 1
worker_class = "sync"
threads = 4

# Logging
loglevel = "info"
errorlog = "-"
accesslog = "-"

# Process Naming
proc_name = "pronouncecraft"

# Timeout and Keepalive
timeout = 120
keepalive = 5

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190