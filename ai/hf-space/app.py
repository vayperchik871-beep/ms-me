import os, gradio as gr
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

MODEL_ID = os.environ.get("MODEL_ID", "TinyLlama/TinyLlama-1.1B-Chat-v1.0")

print(f"Loading {MODEL_ID}...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.bfloat16,
    device_map="auto",
    trust_remote_code=True,
)
print("Model loaded!")

SYSTEM_MSG = {"role": "system", "content": "Ты — MS Assistant, официальный AI-помощник мессенджера MS Messenger. Отвечай коротко и по делу на русском языке. Не говори что ты модель или AI."}

def generate(messages):
    inputs = tokenizer.apply_chat_template(messages, tokenize=True, add_generation_prompt=True, return_tensors="pt").to(model.device)
    with torch.no_grad():
        outputs = model.generate(input_ids=inputs, max_new_tokens=256, temperature=0.7, top_p=0.9, repetition_penalty=1.1, pad_token_id=tokenizer.eos_token_id)
    return tokenizer.decode(outputs[0][inputs.shape[1]:], skip_special_tokens=True).strip()

def chat_fn(message, history):
    msgs = [SYSTEM_MSG]
    for h in history:
        msgs.append({"role": "user", "content": h[0]})
        msgs.append({"role": "assistant", "content": h[1]})
    msgs.append({"role": "user", "content": message})
    return generate(msgs)

demo = gr.ChatInterface(chat_fn, title="MS Assistant")
