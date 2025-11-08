-- Create additional databases
CREATE DATABASE litellm;
CREATE DATABASE synapse_test;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE litellm TO synapse;
GRANT ALL PRIVILEGES ON DATABASE synapse_test TO synapse;