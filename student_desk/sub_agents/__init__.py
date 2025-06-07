"""Sub-agents package for the student desk agent."""

from .semester.agent import semester_agent
from .course.agent import course_agent

__all__ = ["semester_agent", "course_agent"] 