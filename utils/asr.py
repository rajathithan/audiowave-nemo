import torch
import asyncio
import nemo.collections.asr as nemo_asr


async def load_asr_model():    
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"Loading ASR model on device: {device}")
    loop = asyncio.get_event_loop()
    # Run the blocking model load in a thread to avoid blocking the event loop
    model = await loop.run_in_executor(None, lambda: nemo_asr.models.ASRModel.from_pretrained("stt_en_fastconformer_transducer_large"))
    model = model.to(device)
    return model







