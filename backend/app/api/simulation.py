from fastapi import APIRouter, BackgroundTasks
from app.services.simulation_service import simulation_state, step_simulation, get_simulation_status
from pydantic import BaseModel

router = APIRouter(prefix="/simulation", tags=["Disaster Simulation Engine"])

class SpeedRequest(BaseModel):
    speed: int # 1, 5, 10

@router.get("/status")
def status():
    return get_simulation_status()

@router.post("/start")
async def start_simulation(background_tasks: BackgroundTasks):
    simulation_state.is_running = True
    simulation_state.messages.append("Disaster Simulation Started.")
    background_tasks.add_task(step_simulation)
    return get_simulation_status()

@router.post("/pause")
def pause_simulation():
    simulation_state.is_running = False
    simulation_state.messages.append("Disaster Simulation Paused.")
    return get_simulation_status()

@router.post("/step")
async def trigger_step(background_tasks: BackgroundTasks):
    simulation_state.is_running = True
    await step_simulation()
    return get_simulation_status()

@router.post("/reset")
def reset_simulation():
    simulation_state.is_running = False
    simulation_state.current_step = 0
    simulation_state.messages = ["Simulation reset to initial state."]
    return get_simulation_status()

@router.post("/speed")
def set_speed(req: SpeedRequest):
    simulation_state.speed_multiplier = req.speed
    simulation_state.messages.append(f"Simulation playback speed set to {req.speed}x.")
    return get_simulation_status()
