#!/usr/bin/env python3
"""
Detailed ADK Server Testing Script
Tests actual ADK server responses to understand the 500 errors and response patterns.
"""

import asyncio
import httpx
import json
from student_desk.tools.config import Config

async def test_adk_server_detailed():
    """Test ADK server with detailed debugging"""
    
    print("=" * 60)
    print("DETAILED ADK SERVER TESTING")
    print("=" * 60)
    
    # Test user details
    test_user_id = "b4f908e0-3262-4dd8-b63f-14115c724e7f"
    test_session_id = "test_session_detailed"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        
        # 1. Test basic ADK server connection
        print("\n1. Testing basic ADK server connection...")
        try:
            response = await client.get(f"{Config.ADK_SERVER_URL}/")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
        except Exception as e:
            print(f"   ERROR: {e}")
            print("   ❌ ADK server is not running!")
            print(f"   Expected URL: {Config.ADK_SERVER_URL}")
            print("   Make sure to start ADK server with: 'adk run student_desk' in terminal")
            return
        
        # 2. Test app existence
        print(f"\n2. Testing app '{Config.ADK_APP_NAME}' existence...")
        try:
            response = await client.get(f"{Config.ADK_SERVER_URL}/apps/{Config.ADK_APP_NAME}")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
        except Exception as e:
            print(f"   ERROR: {e}")
        
        # 3. Test session creation with proper user_id in state
        print(f"\n3. Testing session creation with user_id in initial_state...")
        try:
            session_payload = {
                "initial_state": {
                    "user_id": test_user_id
                },
                "session_type": "test",
                "created_from": "detailed_test"
            }
            
            response = await client.post(
                f"{Config.ADK_SERVER_URL}/apps/{Config.ADK_APP_NAME}/users/{test_user_id}/sessions/{test_session_id}",
                json=session_payload,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text[:300]}")
            
        except Exception as e:
            print(f"   ERROR: {e}")
        
        # 4. Test simple message to check user context flow
        print(f"\n4. Testing simple message with user context...")
        try:
            message_payload = {
                "appName": Config.ADK_APP_NAME,
                "userId": test_user_id,
                "sessionId": test_session_id,
                "newMessage": {
                    "role": "user",
                    "parts": [{"text": "Hello, can you get my user context?"}]
                }
            }
            
            response = await client.post(
                f"{Config.ADK_SERVER_URL}/run",
                json=message_payload,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Response type: {type(data)}")
                print(f"   Response length: {len(data) if isinstance(data, list) else 'N/A'}")
                
                if isinstance(data, list) and len(data) > 0:
                    # Find the last model response
                    for event in reversed(data):
                        if (event.get("content", {}).get("role") == "model" and 
                            event.get("content", {}).get("parts")):
                            parts = event["content"]["parts"]
                            for part in parts:
                                if "text" in part:
                                    print(f"   Agent Response: {part['text'][:200]}...")
                                    break
                            break
                else:
                    print(f"   Raw Response: {response.text[:300]}")
            else:
                print(f"   ERROR Response: {response.text[:300]}")
                
        except Exception as e:
            print(f"   ERROR: {e}")
        
        # 5. Test handbook-specific message
        print(f"\n5. Testing handbook-specific message...")
        try:
            handbook_payload = {
                "appName": Config.ADK_APP_NAME,
                "userId": test_user_id,
                "sessionId": f"{test_session_id}_handbook",
                "newMessage": {
                    "role": "user",
                    "parts": [{"text": "Answer handbook question: What is the attendance policy?"}]
                }
            }
            
            response = await client.post(
                f"{Config.ADK_SERVER_URL}/run",
                json=handbook_payload,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text[:300]}")
            
        except Exception as e:
            print(f"   ERROR: {e}")

    print("\n" + "=" * 60)
    print("ADK TESTING COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_adk_server_detailed()) 