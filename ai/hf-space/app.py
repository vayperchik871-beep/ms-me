import os, json, torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from huggingface_hub import snapshot_download
from transformers import AutoModelForCausalLM, AutoTokenizer

app = FastAPI()

MODEL_DIR = os.environ.get("MODEL_DIR", "/model")
MODEL_REPO = os.environ.get("MODEL_REPO", "vayperchik871-beep/ms-messenger-assistant")

if not os.path.exists(MODEL_DIR):
    print(f"Downloading model from {MODEL_REPO}...")
    snapshot_download(repo_id=MODEL_REPO, local_dir=MODEL_DIR)

print("Loading model...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_DIR,
    torch_dtype=torch.float16,
    device_map="auto",
    trust_remote_code=True,
)
print("Model loaded!")

SYSTEM_PROMPT = "Ты — MS Assistant, официальный AI-помощник мессенджера MS Messenger. Ты знаешь всё о платформе: функции, настройки, возможности. Отвечай коротко и по делу. Никогда не говори что ты модель, AI, нейросеть или fine-tune. Ты — просто помощник этого мессенджера."

class Query(BaseModel):
    messages: list[dict] = None
    question: str = None

class Response(BaseModel):
    response: str

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/chat", response_model=Response)
def chat(query: Query):
    if query.question:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": query.question},
        ]
    elif query.messages:
        messages = query.messages
    else:
        raise HTTPException(400, "Provide 'question' or 'messages'")

    inputs = tokenizer.apply_chat_template(
        messages, tokenize=True, add_generation_prompt=True, return_tensors="pt"
    ).to(model.device)

    with torch.no_grad():
        outputs = model.generate(
            input_ids=inputs,
            max_new_tokens=512,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.1,
        )

    response = tokenizer.decode(outputs[0][inputs.shape[1]:], skip_special_tokens=True)
    return Response(response=response.strip())
