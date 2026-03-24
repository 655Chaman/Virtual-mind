import sys
import os

# Ensure we can import from the current directory
sys.path.append(os.getcwd())

try:
    print("Importing MemorySystem...")
    from brain.memory import MemorySystem
    print("Initializing MemorySystem...")
    memory = MemorySystem()
    print("MemorySystem initialized.")
    
    print("Adding memory...")
    memory.add_memory("My core value is discipline.")
    print("Memory added.")
    
    print("Retrieving context...")
    context = memory.retrieve_context("What is my core value?")
    print(f"Retrieved Context:\n{context}")
    
except Exception as e:
    print(f"Error: {e}")
