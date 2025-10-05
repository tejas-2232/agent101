/*
  # Add Model Selection to Agents
  
  ## Overview
  Adds model selection capability to agents so users can choose which Llama model
  to use for their specific agent.
  
  ## Changes
  
  ### `agents` table
  - Add `model` column (text) to store the selected Llama model
  - Add `temperature` column (real) to store custom temperature setting
  - Add `max_tokens` column (integer) to store custom max tokens setting
  
  ## Notes
  - Default model is 'llama-3.3-70b' for existing agents
  - Temperature defaults to 0.7
  - Max tokens defaults to 1000
*/

-- Add model selection columns to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS model text DEFAULT 'llama-3.3-70b',
ADD COLUMN IF NOT EXISTS temperature real DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS max_tokens integer DEFAULT 1000;

-- Add constraint to ensure valid model names
ALTER TABLE agents 
ADD CONSTRAINT check_model_name 
CHECK (model IN ('llama-3.3-70b', 'llama-3.1-70b', 'llama-3.1-8b'));

-- Add constraint to ensure valid temperature range
ALTER TABLE agents 
ADD CONSTRAINT check_temperature_range 
CHECK (temperature >= 0.0 AND temperature <= 2.0);

-- Add constraint to ensure valid max tokens range
ALTER TABLE agents 
ADD CONSTRAINT check_max_tokens_range 
CHECK (max_tokens >= 100 AND max_tokens <= 4000);
