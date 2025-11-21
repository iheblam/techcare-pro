import google.generativeai as genai
from django.conf import settings
from .models import ChatSession, ChatMessage

# Configure Gemini with your API key
genai.configure(api_key=settings.GEMINI_API_KEY)


class GeminiChatService:
    """
    Service class for handling Gemini AI interactions with fallback support
    """
    
    def __init__(self):
        # Primary model: Gemini 2.0 Flash (experimental, latest features)
        self.primary_model = genai.GenerativeModel('gemini-2.0-flash-exp')
        # Fallback model: Gemini 1.5 Flash (stable, higher quota)
        self.fallback_model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Track which model is currently in use
        self.current_model = self.primary_model
        self.model_name = 'gemini-2.0-flash-exp'
        
        # System instruction for PC repair assistant
        self.system_instruction = """You are an expert PC repair assistant helping users diagnose and fix computer problems.

Your role:
- Ask clear diagnostic questions to understand the problem
- Provide step-by-step solutions that are easy to follow
- Use simple language, avoid overly technical jargon
- Be patient, friendly, and professional
- Focus on safe, practical solutions
- If a problem requires physical inspection or is too complex for remote help, recommend booking a technician

When to escalate to human technician:
- Hardware needs physical inspection or replacement
- Problem involves opening the computer case (unless user is comfortable)
- Issue is too complex after multiple troubleshooting attempts
- User explicitly requests human help
- Potential data loss situations that need professional backup

When you determine escalation is needed, include this exact phrase in your response:
"ESCALATE_TO_TECHNICIAN: [brief reason why]"

Always end your initial message by asking what problem they're experiencing."""
    
    def start_chat_session(self, session_id, issue_type):
        """
        Generate welcome message for new chat session
        """
        welcome_message = f"""👋 Hello! I'm your AI PC repair assistant powered by Gemini.

I see you're having a **{issue_type}** problem. I'm here to help you diagnose and fix the issue!

To assist you better, please tell me:
1. **What exactly is happening?** (Describe the problem)
2. **When did this start?** (After an update? Suddenly? Gradually?)
3. **Any error messages?** (Exact text if possible)
4. **What have you tried so far?** (If anything)

Please describe your issue in as much detail as possible, and I'll guide you through the troubleshooting steps! 💻"""
        
        return welcome_message
    
    def get_ai_response(self, session: ChatSession, user_message: str):
        """
        Get response from Gemini based on conversation history
        
        Args:
            session: ChatSession object
            user_message: Latest message from user
            
        Returns:
            dict: {
                'response': AI response text,
                'should_escalate': Boolean indicating if technician needed
            }
        """
        try:
            # Build conversation context from chat history
            conversation_context = self._build_conversation_context(session)
            
            # Create the full prompt with context
            full_prompt = f"""{self.system_instruction}

ISSUE TYPE: {session.get_issue_type_display()}

CONVERSATION HISTORY:
{conversation_context}

USER'S LATEST MESSAGE:
{user_message}

Your response (be helpful, clear, and step-by-step):"""
            
            # Try primary model first, fallback to secondary if quota exceeded
            ai_response = None
            try:
                response = self.current_model.generate_content(full_prompt)
                ai_response = response.text
            except Exception as primary_error:
                error_str = str(primary_error)
                
                # Check if it's a quota/rate limit error (429 or quota exceeded)
                if "429" in error_str or "quota" in error_str.lower() or "rate limit" in error_str.lower():
                    # Switch to fallback model
                    if self.current_model == self.primary_model:
                        print(f"Gemini 2.0 quota exceeded, switching to stable Gemini 1.5 Flash...")
                        self.current_model = self.fallback_model
                        self.model_name = 'gemini-1.5-flash'
                        
                        try:
                            # Retry with fallback model
                            response = self.current_model.generate_content(full_prompt)
                            ai_response = response.text
                            ai_response = f"ℹ️ *Using stable Gemini 1.5 Flash*\n\n{ai_response}"
                        except Exception as fallback_error:
                            # Both models failed
                            raise Exception(f"Both AI models unavailable. Primary: {error_str[:100]}, Fallback: {str(fallback_error)[:100]}")
                    else:
                        # Already on fallback, try switching back to primary
                        print(f"Gemini 1.5 quota exceeded, trying Gemini 2.0 again...")
                        self.current_model = self.primary_model
                        self.model_name = 'gemini-2.0-flash-exp'
                        
                        try:
                            response = self.current_model.generate_content(full_prompt)
                            ai_response = response.text
                        except:
                            # Both models exhausted
                            raise Exception("AI service temporarily unavailable due to high usage. Please try again in a few moments or speak with a human technician.")
                else:
                    # Non-quota error, re-raise
                    raise primary_error
            
            if not ai_response:
                raise Exception("Unable to generate response")
            
            # Check if AI recommends escalation
            should_escalate = "ESCALATE_TO_TECHNICIAN" in ai_response
            
            if should_escalate:
                # Clean up the response by removing the escalation marker
                ai_response = ai_response.replace("ESCALATE_TO_TECHNICIAN:", "").strip()
                
                # Add helpful message for user
                ai_response += "\n\n---\n\n⚠️ **This issue may require hands-on assistance from our technicians.**\n\nWould you like me to help you book a session with one of our expert technicians? They can provide personalized support and, if needed, visit your location."
            
            return {
                'response': ai_response,
                'should_escalate': should_escalate
            }
            
        except Exception as e:
            # Handle any errors gracefully
            error_message = f"I apologize, but I'm having trouble processing your request right now. Error: {str(e)}"
            
            return {
                'response': f"{error_message}\n\n❓ Would you like to speak with one of our human technicians instead? They can help you right away!",
                'should_escalate': True
            }
    
    def _build_conversation_context(self, session: ChatSession, max_messages=15):
        """
        Build conversation context from recent messages
        
        Args:
            session: ChatSession object
            max_messages: Maximum number of recent messages to include
            
        Returns:
            str: Formatted conversation history
        """
        # Get recent messages
        messages = session.messages.order_by('timestamp')[:max_messages]
        
        if not messages.exists():
            return "No previous conversation."
        
        context = ""
        for msg in messages:
            role = "USER" if msg.sender == 'user' else "ASSISTANT"
            context += f"\n{role}: {msg.message}\n"
        
        return context
    
    def generate_problem_summary(self, session: ChatSession):
        """
        Generate a concise summary of the problem for ticket creation
        
        Args:
            session: ChatSession object
            
        Returns:
            str: Brief summary of the problem
        """
        try:
            conversation = self._build_conversation_context(session)
            
            if not conversation or conversation == "No previous conversation.":
                return "User requested technician assistance without providing problem details."
            
            prompt = f"""Based on this conversation between a user and a PC repair assistant, provide a concise technical summary (2-3 sentences maximum) of the user's problem:

{conversation}

Technical Summary:"""
            
            response = self.current_model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            return f"Unable to generate summary. Conversation available in chat history. Error: {str(e)}"
    
    def get_model_status(self):
        """
        Get current model status
        
        Returns:
            dict: Current model information
        """
        return {
            'current_model': self.model_name,
            'is_fallback': self.current_model == self.fallback_model
        }
    
    def reset_to_primary_model(self):
        """
        Reset to primary model (useful after quota cooldown)
        """
        self.current_model = self.primary_model
        self.model_name = 'gemini-1.5-flash'
        print("Reset to primary model: gemini-1.5-flash")
    
    def get_model_status(self):
        """
        Get current model status
        
        Returns:
            dict: Current model information
        """
        return {
            'current_model': self.model_name,
            'is_fallback': self.current_model == self.fallback_model
        }
    
    def reset_to_primary_model(self):
        """
        Reset to primary model (useful after quota cooldown)
        """
        self.current_model = self.primary_model
        self.model_name = 'gemini-2.0-flash-exp'
        print("Reset to primary model: gemini-2.0-flash-exp")
    
    def suggest_solution_from_library(self, user_problem: str):
        """
        Search for similar resolved issues that might help
        
        Args:
            user_problem: Description of the user's problem
            
        Returns:
            list: List of potentially relevant resolved issues
        """
        from issues.models import ResolvedIssue
        from django.db.models import Q
        
        # Extract key terms (simple approach)
        keywords = user_problem.lower().split()
        
        # Search for similar issues
        similar_issues = ResolvedIssue.objects.filter(
            Q(title__icontains=user_problem) |
            Q(description__icontains=user_problem) |
            Q(tags__icontains=user_problem)
        )[:3]  # Top 3 matches
        
        return similar_issues