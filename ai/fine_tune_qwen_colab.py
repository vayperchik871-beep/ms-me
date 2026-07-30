"""
# Fine-tune Qwen 2.5 1.5B — MS Messenger Assistant
# Запускать в Google Colab (Runtime → Run all)
# Бесплатно, ~2 часа на T4 GPU
"""

# @title 1. Установка зависимостей
# @markdown Устанавливаем Unsloth + зависимости

import subprocess
import sys
import os

def install_deps():
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])
    subprocess.check_call([sys.executable, "-m", "pip", "install", "unsloth[colab-new]"])
    subprocess.check_call([sys.executable, "-m", "pip", "install",
        "xformers", "trl", "peft", "accelerate", "bitsandbytes",
        "torch", "torchvision", "torchaudio",
        "datasets", "transformers", "huggingface_hub"])

install_deps()

# @title 2. Монтируем Google Drive
# @markdown Датасет будет загружен сюда. Можно закинуть свой train_dataset.jsonl

from google.colab import drive
drive.mount('/content/drive')

# Создаём папку для проекта
DATA_DIR = "/content/drive/MyDrive/ms-messenger-ai"
os.makedirs(DATA_DIR, exist_ok=True)

# @title 3. Загружаем датасет
# @markdown Загрузи train_dataset.jsonl в Google Drive или укажи URL

import requests
import json

# Попробуем скачать из репозитория (замени на свой URL если нужно)
DATASET_URL = "https://raw.githubusercontent.com/vayperchik871-beep/ms-me/main/ai/train_dataset.jsonl"
DATASET_PATH = os.path.join(DATA_DIR, "train_dataset.jsonl")

if not os.path.exists(DATASET_PATH):
    print(f"Скачиваю датасет с {DATASET_URL}...")
    resp = requests.get(DATASET_URL)
    with open(DATASET_PATH, "wb") as f:
        f.write(resp.content)
    print(f"Скачано {len(resp.content)} байт")
else:
    print(f"Датасет уже есть: {DATASET_PATH}")

# Проверяем
with open(DATASET_PATH) as f:
    lines = f.readlines()
print(f"Всего примеров: {len(lines)}")
print(f"Первый: {lines[0][:100]}...")

# @title 4. Загружаем модель Qwen 2.5 1.5B
# @markdown Загружаем базовую модель + токенизатор через Unsloth

import torch
from unsloth import FastLanguageModel

MAX_SEQ_LENGTH = 1024
MODEL_NAME = "unsloth/Qwen2.5-1.5B-bnb-4bit"  # 4-bit quantized — помещается в 6GB VRAM

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=MODEL_NAME,
    max_seq_length=MAX_SEQ_LENGTH,
    dtype=None,
    load_in_4bit=True,
)

# Добавляем LoRA адаптеры (обучаются только они)
model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    lora_alpha=16,
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=42,
    use_rslora=False,
    loftq_config=None,
)

print(f"Trainable params: {sum(p.numel() for p in model.parameters() if p.requires_grad)}")

# @title 5. Форматируем датасет
# @markdown Приводим JSONL к формату ChatML для Qwen

from datasets import load_dataset

# Загружаем JSONL
dataset = load_dataset("json", data_files=DATASET_PATH, split="train")

# Формат: система записана один раз в каждый пример
def format_chat(example):
    return {
        "text": tokenizer.apply_chat_template(
            example["messages"],
            tokenize=False,
            add_generation_prompt=False,
        )
    }

dataset = dataset.map(format_chat)

# Проверяем
print(dataset[0]["text"][:300])
print("...")
print(f"Датасет: {len(dataset)} примеров")

# @title 6. Запускаем обучение
# @markdown Fine-tune ~1-2 часа на T4

from trl import SFTTrainer
from transformers import TrainingArguments
from unsloth import is_bfloat16_supported

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    dataset_text_field="text",
    max_seq_length=MAX_SEQ_LENGTH,
    dataset_num_proc=2,
    packing=False,
    args=TrainingArguments(
        per_device_train_batch_size=4,
        gradient_accumulation_steps=4,
        warmup_steps=5,
        num_train_epochs=3,
        learning_rate=2e-4,
        fp16=not is_bfloat16_supported(),
        bf16=is_bfloat16_supported(),
        logging_steps=10,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="linear",
        seed=42,
        output_dir=os.path.join(DATA_DIR, "output"),
        report_to="none",
    ),
)

trainer.train()

# @title 7. Сохраняем модель в Drive
# @markdown Сохраняем LoRA веса + полную модель

# Сохраняем LoRA адаптеры
lora_path = os.path.join(DATA_DIR, "ms-assistant-lora")
model.save_pretrained(lora_path)
tokenizer.save_pretrained(lora_path)
print(f"LoRA сохранён в {lora_path}")

# Сохраняем merge (полная модель) — можно загружать без Unsloth
merged_path = os.path.join(DATA_DIR, "ms-assistant-merged")
model.save_pretrained_merged(merged_path, tokenizer, save_method="merged_16bit")
print(f"Мерж сохранён в {merged_path}")

# Сохраняем в GGUF (для использования в Ollama/LM Studio)
gguf_path = os.path.join(DATA_DIR, "ms-assistant.gguf")
model.save_pretrained_gguf(gguf_path, tokenizer, quantization_method="q4_k_m")
print(f"GGUF сохранён в {gguf_path}")

# @title 8. Тестируем модель
# @markdown Пробуем задать вопросы прямо в Colab

from transformers import TextStreamer

# Загружаем LoRA веса (если обучение уже было)
# model, tokenizer = FastLanguageModel.from_pretrained(
#     lora_path,
#     max_seq_length=1024,
#     dtype=None,
#     load_in_4bit=True,
# )
# FastLanguageModel.for_inference(model)

FastLanguageModel.for_inference(model)

system_prompt = "Ты — MS Assistant, официальный AI-помощник мессенджера MS Messenger."

test_questions = [
    "Как отправить подарок в чате?",
    "Что такое Plus подписка?",
    "Как работает шифрование?",
]

for question in test_questions:
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": question},
    ]

    inputs = tokenizer.apply_chat_template(
        messages,
        tokenize=True,
        add_generation_prompt=True,
        return_tensors="pt",
    ).to("cuda")

    print(f"\n=== Вопрос: {question} ===")
    outputs = model.generate(
        input_ids=inputs,
        max_new_tokens=256,
        temperature=0.7,
        top_p=0.9,
        repetition_penalty=1.1,
    )
    response = tokenizer.decode(outputs[0][inputs.shape[1]:], skip_special_tokens=True)
    print(f"Ответ: {response.strip()}")
    print()

# @title 9. Публикуем на Hugging Face (опционально)
# @markdown Заливаем модель на Hugging Face Hub для использования из приложения

from huggingface_hub import login, HfApi

PUBLISH = False  # Поставь True, если хочешь опубликовать

if PUBLISH:
    HF_TOKEN = input("Введи Hugging Face токен (Settings → Access Tokens): ")
    login(token=HF_TOKEN)
    REPO_NAME = "ms-messenger-assistant"  # название репозитория

    api = HfApi()
    api.create_repo(repo_id=f"vayperchik871-beep/{REPO_NAME}", exist_ok=True)
    api.upload_folder(
        folder_path=merged_path,
        repo_id=f"vayperchik871-beep/{REPO_NAME}",
    )
    print(f"Модель опубликована: https://huggingface.co/vayperchik871-beep/{REPO_NAME}")

print("""
=== ГОТОВО ===

Модель сохранена в Google Drive:
  - LoRA: /content/drive/MyDrive/ms-messenger-ai/ms-assistant-lora/
  - Merged: /content/drive/MyDrive/ms-messenger-ai/ms-assistant-merged/
  - GGUF (для Ollama): /content/drive/MyDrive/ms-messenger-ai/ms-assistant.gguf

Для интеграции в приложение:
1. Залить merged модель на Hugging Face
2. Создать HF Space с FastAPI эндпоинтом
3. В приложении вызывать этот эндпоинт
""")
