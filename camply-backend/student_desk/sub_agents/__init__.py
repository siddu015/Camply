"""Sub-agents for the Student Desk Agent System."""

from .campus_agent import root_agent as campus_agent
from .handbook_agent import root_agent as handbook_agent
from .syllabus_agent import syllabus_agent
from .course_agent import course_agent

__all__ = ["campus_agent", "handbook_agent", "syllabus_agent", "course_agent"] 