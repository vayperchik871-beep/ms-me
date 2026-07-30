# MS Messenger AI Assistant

## Файлы

- `train_dataset.jsonl` — датасет для fine-tune (200+ QA пар)
- `fine_tune_qwen_colab.py` — Colab ноутбук для обучения (открыть в Google Colab и запустить)

## Инструкция

1. Открой `fine_tune_qwen_colab.py` в Google Colab
2. Runtime → Run all
3. Через ~2 часа модель будет в Google Drive
4. Залей на Hugging Face и подключи к приложению

## Персона

Модель обучена отвечать как MS Assistant — официальный помощник мессенджера. Она НЕ раскрывает что это AI/модель/fine-tune. Просто отвечает на вопросы.
