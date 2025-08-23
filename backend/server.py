from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime, date, time, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
import os
import uuid
import asyncio
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.kamile_nails

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    try:
        # Startup: Create indexes for better performance
        await db.bookings.create_index([("date", 1), ("time", 1)])
        await db.bookings.create_index([("client_phone", 1)])
        await db.bookings.create_index([("status", 1)])
        await db.bookings.create_index([("created_at", -1)])
        
        logger.info("Database indexes created successfully")
        logger.info("Kamile Nails API started successfully")
        
        yield
        
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")
    finally:
        # Shutdown: Clean up resources
        try:
            client.close()
            logger.info("Database connection closed")
            logger.info("Kamile Nails API shutdown successfully")
        except Exception as e:
            logger.error(f"Error during shutdown: {str(e)}")

app = FastAPI(title="Kamile Nails API", version="1.0.0", lifespan=lifespan)

# Pydantic models
class BookingCreate(BaseModel):
    date: str
    time: str
    client_name: str
    client_phone: str
    notes: Optional[str] = ""
    
    @field_validator('date')
    @classmethod
    def validate_date(cls, v):
        try:
            datetime.strptime(v, '%Y-%m-%d')
            return v
        except ValueError:
            raise ValueError('Date must be in YYYY-MM-DD format')
    
    @field_validator('time')
    @classmethod
    def validate_time(cls, v):
        try:
            datetime.strptime(v, '%H:%M')
            return v
        except ValueError:
            raise ValueError('Time must be in HH:MM format')
    
    @field_validator('client_name')
    @classmethod
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Name must have at least 2 characters')
        return v.strip()
    
    @field_validator('client_phone')
    @classmethod
    def validate_phone(cls, v):
        # Remove common phone formatting
        phone = v.replace('(', '').replace(')', '').replace('-', '').replace(' ', '')
        if len(phone) < 10:
            raise ValueError('Phone number must have at least 10 digits')
        return v.strip()

class BookingResponse(BaseModel):
    id: str
    date: str
    time: str
    client_name: str
    client_phone: str
    notes: str
    status: str
    created_at: datetime

# Helper functions
def generate_time_slots() -> List[str]:
    """Generate available time slots from 8:00 to 17:00"""
    slots = []
    for hour in range(8, 18):  # 8 AM to 5 PM (last appointment at 5 PM)
        slots.append(f"{hour:02d}:00")
    return slots

def is_business_day(date_obj: date) -> bool:
    """Check if date is a business day (Monday-Friday)"""
    return date_obj.weekday() < 5  # 0-4 are Monday-Friday

async def send_whatsapp_notification(phone: str, message: str):
    """Mock function for WhatsApp notification (would integrate with WhatsApp Business API)"""
    # In a real implementation, this would send via WhatsApp Business API
    logger.info(f"WhatsApp notification would be sent to {phone}: {message}")
    await asyncio.sleep(0.1)  # Simulate API call delay

# API Endpoints
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Kamile Nails API"}

@app.get("/api/available-slots")
async def get_available_slots(date: str):
    """Get available time slots for a specific date"""
    try:
        # Parse and validate date
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        
        # Check if it's a business day
        if not is_business_day(date_obj):
            return JSONResponse(
                status_code=400,
                content={"detail": "We don't work on weekends"}
            )
        
        # Check if date is not in the past
        if date_obj < datetime.now().date():
            return JSONResponse(
                status_code=400,
                content={"detail": "Cannot book appointments in the past"}
            )
        
        # Get all bookings for the specified date
        bookings = await db.bookings.find({"date": date, "status": "confirmed"}).to_list(None)
        booked_times = {booking["time"] for booking in bookings}
        
        # Generate all possible slots and filter out booked ones
        all_slots = generate_time_slots()
        available_slots = [slot for slot in all_slots if slot not in booked_times]
        
        return available_slots
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except Exception as e:
        logger.error(f"Error getting available slots: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/bookings")
async def create_booking(booking: BookingCreate, background_tasks: BackgroundTasks):
    """Create a new booking"""
    try:
        # Parse date
        date_obj = datetime.strptime(booking.date, '%Y-%m-%d').date()
        
        # Validate business day
        if not is_business_day(date_obj):
            raise HTTPException(status_code=400, detail="We don't work on weekends")
        
        # Validate future date
        if date_obj < datetime.now().date():
            raise HTTPException(status_code=400, detail="Cannot book appointments in the past")
        
        # Check if the time slot is available
        existing_booking = await db.bookings.find_one({
            "date": booking.date,
            "time": booking.time,
            "status": "confirmed"
        })
        
        if existing_booking:
            raise HTTPException(status_code=409, detail="This time slot is already booked")
        
        # Create booking document
        booking_id = str(uuid.uuid4())
        booking_doc = {
            "id": booking_id,
            "date": booking.date,
            "time": booking.time,
            "client_name": booking.client_name,
            "client_phone": booking.client_phone,
            "notes": booking.notes,
            "status": "confirmed",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert booking
        result = await db.bookings.insert_one(booking_doc)
        
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to create booking")
        
        # Schedule WhatsApp notification in background
        notification_message = f"Novo agendamento confirmado!\n\nData: {booking.date}\nHorário: {booking.time}\nCliente: {booking.client_name}\nTelefone: {booking.client_phone}"
        background_tasks.add_task(send_whatsapp_notification, "5511963065438", notification_message)
        
        # Return created booking
        return BookingResponse(**booking_doc)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating booking: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/bookings")
async def get_bookings(date: Optional[str] = None, status: Optional[str] = None):
    """Get bookings with optional filtering"""
    try:
        # Build query filter
        query_filter = {}
        if date:
            # Validate date format
            datetime.strptime(date, '%Y-%m-%d')
            query_filter["date"] = date
        if status:
            query_filter["status"] = status
        
        # Get bookings
        bookings = await db.bookings.find(query_filter).sort("date", 1).sort("time", 1).to_list(None)
        
        # Convert to response format
        booking_responses = []
        for booking in bookings:
            booking_responses.append(BookingResponse(**booking))
        
        return booking_responses
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except Exception as e:
        logger.error(f"Error getting bookings: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/bookings/{booking_id}")
async def get_booking(booking_id: str):
    """Get a specific booking by ID"""
    try:
        booking = await db.bookings.find_one({"id": booking_id})
        
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        return BookingResponse(**booking)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting booking: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.put("/api/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str, background_tasks: BackgroundTasks):
    """Cancel a booking"""
    try:
        # Find and update booking
        result = await db.bookings.update_one(
            {"id": booking_id, "status": {"$ne": "cancelled"}},
            {
                "$set": {
                    "status": "cancelled",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Booking not found or already cancelled")
        
        # Get updated booking
        booking = await db.bookings.find_one({"id": booking_id})
        
        # Schedule WhatsApp notification
        notification_message = f"Agendamento cancelado!\n\nData: {booking['date']}\nHorário: {booking['time']}\nCliente: {booking['client_name']}"
        background_tasks.add_task(send_whatsapp_notification, "5511963065438", notification_message)
        
        return BookingResponse(**booking)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling booking: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        today = datetime.now().date().strftime('%Y-%m-%d')
        
        # Count total bookings
        total_bookings = await db.bookings.count_documents({"status": "confirmed"})
        
        # Count today's bookings
        today_bookings = await db.bookings.count_documents({
            "date": today,
            "status": "confirmed"
        })
        
        # Count this month's bookings
        current_month = datetime.now().strftime('%Y-%m')
        month_bookings = await db.bookings.count_documents({
            "date": {"$regex": f"^{current_month}"},
            "status": "confirmed"
        })
        
        return {
            "total_bookings": total_bookings,
            "today_bookings": today_bookings,
            "month_bookings": month_bookings,
            "generated_at": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database indexes on startup"""
    try:
        # Create indexes for better performance
        await db.bookings.create_index([("date", 1), ("time", 1)])
        await db.bookings.create_index([("client_phone", 1)])
        await db.bookings.create_index([("status", 1)])
        await db.bookings.create_index([("created_at", -1)])
        
        logger.info("Database indexes created successfully")
        logger.info("Kamile Nails API started successfully")
        
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    try:
        client.close()
        logger.info("Database connection closed")
        logger.info("Kamile Nails API shutdown successfully")
        
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)