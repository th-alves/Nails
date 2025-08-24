from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime, date
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://kamile:nails2025@clusterk.qp4aihj.mongodb.net/kamile_nails?retryWrites=true&w=majority&appName=ClusterK")

app = FastAPI(title="Kamile Nails API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global database connection
_client = None
_db = None

async def get_database():
    global _client, _db
    if _client is None:
        _client = AsyncIOMotorClient(MONGO_URL)
        _db = _client.kamile_nails
        # Create indexes
        try:
            await _db.bookings.create_index([("date", 1), ("time", 1)])
            await _db.bookings.create_index([("status", 1)])
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")
    return _db

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
    for hour in range(8, 18):
        slots.append(f"{hour:02d}:00")
    return slots

def is_business_day(date_obj: date) -> bool:
    """Check if date is a business day (Monday-Friday)"""
    return date_obj.weekday() < 5

# API Endpoints
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Kamile Nails API"}

@app.get("/api/available-slots")
async def get_available_slots(date: str):
    """Get available time slots for a specific date"""
    try:
        db = await get_database()
        
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
async def create_booking(booking: BookingCreate):
    """Create a new booking"""
    try:
        db = await get_database()
        
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
        db = await get_database()
        
        # Build query filter
        query_filter = {}
        if date:
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
        db = await get_database()
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
async def cancel_booking(booking_id: str):
    """Cancel a booking"""
    try:
        db = await get_database()
        
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
        db = await get_database()
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

# Vercel serverless function handler
async def handler(request):
    import asyncio
    from fastapi import Request
    
    # Handle preflight OPTIONS requests
    if request.method == "OPTIONS":
        return JSONResponse(
            content={},
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            }
        )
    
    # Convert Vercel request to FastAPI request
    scope = {
        "type": "http",
        "method": request.method,
        "path": request.url.path,
        "query_string": str(request.url.query).encode(),
        "headers": [(k.encode(), v.encode()) for k, v in request.headers.items()],
    }
    
    receive = lambda: {"type": "http.request", "body": request.body}
    
    response = {"status_code": 200, "headers": [], "body": b""}
    
    def send(message):
        if message["type"] == "http.response.start":
            response["status_code"] = message["status"]
            response["headers"] = message["headers"]
        elif message["type"] == "http.response.body":
            response["body"] += message.get("body", b"")
    
    await app(scope, receive, send)
    
    return {
        "statusCode": response["status_code"],
        "headers": {k.decode(): v.decode() for k, v in response["headers"]},
        "body": response["body"].decode(),
    }