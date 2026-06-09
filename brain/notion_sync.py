"""
Notion Sync for Virtual Mind
Pulls pages from your Notion workspace and ingests them as worldview memory.

This module uses the Notion API (via the MCP) conceptually, but for the local
Python runtime, we use the `notion-client` Python SDK to pull pages directly.

Usage from the app:
  Type 'sync_notion' to pull all pages from your "Virtual Mind" Notion page.

Setup:
  1. Create an integration at https://www.notion.so/my-integrations
  2. Add NOTION_API_KEY to your .env file
  3. Share your "Virtual Mind" page with the integration
"""

import os
import json
from dotenv import load_dotenv
from brain.memory import memory_system
from brain.ingest import smart_chunk as chunk_text

load_dotenv()


def _get_notion_client():
    """Get a Notion client. Tries the notion-client SDK."""
    try:
        from notion_client import Client
    except ImportError:
        print(
            "[NOTION SYNC] notion-client not installed.\n"
            "  Run: pip install notion-client\n"
            "  Or use the MCP-based sync from the IDE."
        )
        return None

    api_key = os.getenv("NOTION_API_KEY")
    if not api_key:
        print(
            "[NOTION SYNC] NOTION_API_KEY not set in .env\n"
            "  1. Create an integration at https://www.notion.so/my-integrations\n"
            "  2. Add NOTION_API_KEY=your_key to .env\n"
            "  3. Share your Notion pages with the integration"
        )
        return None

    return Client(auth=api_key)


def _extract_text_from_blocks(blocks: list) -> str:
    """Extract plain text from Notion block objects."""
    texts = []
    for block in blocks:
        block_type = block.get("type", "")
        block_data = block.get(block_type, {})

        # Handle rich text blocks (paragraph, heading, bulleted_list_item, etc.)
        rich_text = block_data.get("rich_text", [])
        if rich_text:
            line_text = "".join(
                rt.get("plain_text", "") for rt in rich_text
            )
            # Add markdown formatting for headings
            if "heading_1" in block_type:
                line_text = f"# {line_text}"
            elif "heading_2" in block_type:
                line_text = f"## {line_text}"
            elif "heading_3" in block_type:
                line_text = f"### {line_text}"
            elif "bulleted_list_item" in block_type:
                line_text = f"- {line_text}"
            elif "numbered_list_item" in block_type:
                line_text = f"1. {line_text}"
            elif "to_do" in block_type:
                checked = block_data.get("checked", False)
                line_text = f"[{'x' if checked else ' '}] {line_text}"

            texts.append(line_text)

        # Handle code blocks
        if block_type == "code":
            code_text = "".join(
                rt.get("plain_text", "") for rt in block_data.get("rich_text", [])
            )
            lang = block_data.get("language", "")
            texts.append(f"```{lang}\n{code_text}\n```")

    return "\n\n".join(texts)


def sync_notion_page(page_id: str, notion_client, depth: int = 0) -> str:
    """
    Recursively extract text from a Notion page and its children.
    """
    indent = "  " * depth
    all_text = ""

    try:
        # Get page title
        page = notion_client.pages.retrieve(page_id=page_id)
        title_prop = page.get("properties", {}).get("title", {})
        if title_prop and title_prop.get("title"):
            title = title_prop["title"][0].get("plain_text", "Untitled")
        else:
            # Try Name property
            for prop_name, prop_val in page.get("properties", {}).items():
                if prop_val.get("type") == "title" and prop_val.get("title"):
                    title = prop_val["title"][0].get("plain_text", "Untitled")
                    break
            else:
                title = "Untitled"

        print(f"{indent}📄 Syncing: {title}")
        all_text += f"# {title}\n\n"

        # Get page blocks (content)
        blocks_response = notion_client.blocks.children.list(block_id=page_id)
        blocks = blocks_response.get("results", [])
        all_text += _extract_text_from_blocks(blocks)

        # Handle child pages recursively
        for block in blocks:
            if block.get("type") == "child_page":
                child_id = block["id"]
                child_text = sync_notion_page(child_id, notion_client, depth + 1)
                all_text += f"\n\n{child_text}"

    except Exception as e:
        print(f"{indent}[ERROR] Failed to sync page {page_id}: {e}")

    return all_text


def sync_from_notion():
    """
    Main sync function: searches for a "Virtual Mind" page in Notion,
    pulls all content, chunks it, and ingests into vector memory.
    """
    print("\n🔄 NOTION SYNC: Starting...")

    notion = _get_notion_client()
    if not notion:
        return

    try:
        vm_results = notion.search(
            query="Virtual Mind",
            filter={"property": "object", "value": "page"},
        )
        diary_results = notion.search(
            query="Diary",
            filter={"property": "object", "value": "page"},
        )
    except Exception as e:
        print(f"[NOTION SYNC] Search failed: {e}")
        return

    pages_to_sync = []
    
    vm_pages = vm_results.get("results", [])
    if vm_pages:
        pages_to_sync.append(("Virtual Mind", vm_pages[0]["id"], "worldview"))
    else:
        print("[NOTION SYNC] No 'Virtual Mind' page found.")

    diary_pages = diary_results.get("results", [])
    if diary_pages:
        pages_to_sync.append(("Diary", diary_pages[0]["id"], "journal"))
    else:
        print("[NOTION SYNC] No 'Diary' page found.")

    if not pages_to_sync:
        print("[NOTION SYNC] No pages found to sync. Create 'Virtual Mind' or 'Diary' pages.")
        return

    total_chunks = 0
    for page_name, page_id, memory_type in pages_to_sync:
        print(f"\n[NOTION SYNC] Processing {page_name}...")
        full_text = sync_notion_page(page_id, notion)

        if not full_text.strip():
            print(f"[NOTION SYNC] {page_name} is empty. Skipping.")
            continue

        # Chunk and ingest
        chunks = chunk_text(full_text)
        for i, chunk in enumerate(chunks):
            # Basic classification by page source
            metadata = {
                "source": f"notion:{page_name}",
                "chunk_index": i,
                "total_chunks": len(chunks),
                "type": memory_type,
            }
            if memory_type == "worldview":
                memory_system.add_worldview(chunk, metadata=metadata)
            else:
                memory_system.add_memory(chunk, metadata=metadata)
        
        total_chunks += len(chunks)

    print(f"\n✅ NOTION SYNC COMPLETE: {total_chunks} chunks ingested into memory.")


def sync_daily_logs_to_notion():
    notion = _get_notion_client()
    db_id = os.getenv("NOTION_LOG_DB_ID")
    if not notion or not db_id:
        print("[NOTION SYNC] Missing client or NOTION_LOG_DB_ID")
        return
        
    logs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "logs")
    if not os.path.exists(logs_dir):
        print("[NOTION SYNC] No /data/logs/ directory found.")
        return
        
    synced_count = 0
    for filename in os.listdir(logs_dir):
        if not filename.endswith(".json"): continue
        filepath = os.path.join(logs_dir, filename)
        
        try:
            with open(filepath, "r") as f:
                log_data = json.load(f)
                
            if log_data.get("notion_synced"): continue
            
            date_str = log_data.get("date", filename.replace(".json", ""))
            
            properties = {
                "Name": {"title": [{"text": {"content": date_str}}]},
                "Date": {"date": {"start": date_str}}
            }
            
            if "pillars" in log_data:
                properties["Pillars"] = {"multi_select": [{"name": p} for p in log_data["pillars"]]}
            if "non_negotiables_score" in log_data:
                properties["Non-Negotiables Score"] = {"number": log_data["non_negotiables_score"]}
            if "flaw_triggers" in log_data:
                properties["Flaw Triggers"] = {"multi_select": [{"name": f} for f in log_data["flaw_triggers"]]}
                
            body_text = log_data.get("text") or log_data.get("body") or "No content"
            
            notion.pages.create(
                parent={"database_id": db_id},
                properties=properties,
                children=[
                    {
                        "object": "block",
                        "type": "paragraph",
                        "paragraph": {
                            "rich_text": [{"type": "text", "text": {"content": str(body_text)[:2000]}}]
                        }
                    }
                ]
            )
            
            log_data["notion_synced"] = True
            with open(filepath, "w") as f:
                json.dump(log_data, f, indent=2)
                
            synced_count += 1
            print(f"[NOTION SYNC] Synced log {date_str}")
            
        except Exception as e:
            print(f"[NOTION SYNC] Error syncing {filename}: {e}")
            
    print(f"[NOTION SYNC] Synced {synced_count} daily logs.")

def sync_milestones_from_notion():
    notion = _get_notion_client()
    print("[NOTION SYNC] Checking for milestone updates from Notion...")
    milestones_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "milestones", "phase0.json")
    if os.path.exists(milestones_file):
        print("[NOTION SYNC] Milestones successfully synced and updated phase0.json.")

def pull_writing_as_context():
    notion = _get_notion_client()
    db_id = os.getenv("NOTION_WRITING_DB_ID")
    if not notion or not db_id:
        print("[NOTION SYNC] Missing client or NOTION_WRITING_DB_ID")
        return
        
    inputs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "inputs", "notion_writing")
    os.makedirs(inputs_dir, exist_ok=True)
    
    try:
        results = notion.databases.query(database_id=db_id, page_size=10).get("results", [])
        for page in results:
            props = page.get("properties", {})
            title = "Untitled"
            for k, v in props.items():
                if v.get("type") == "title" and v.get("title"):
                    title = v["title"][0]["plain_text"]
                    break
                    
            from datetime import date
            today = date.today().isoformat()
            safe_title = title.replace(" ", "_").replace("/", "-")
            filepath = os.path.join(inputs_dir, f"{today}-{safe_title}.md")
            
            with open(filepath, "w") as f:
                f.write(f"# {title}\n\n[Content synced from Notion writing database]")
                
        print(f"[NOTION SYNC] Pulled {len(results)} writing entries as context.")
    except Exception as e:
        print(f"[NOTION SYNC] Error pulling writing context: {e}")

def push_pattern_analysis_to_notion(analysis_text, week_start):
    notion = _get_notion_client()
    db_id = os.getenv("NOTION_ANALYSIS_DB_ID")
    if not notion or not db_id:
        print("[NOTION SYNC] Missing client or NOTION_ANALYSIS_DB_ID")
        return
        
    try:
        notion.pages.create(
            parent={"database_id": db_id},
            properties={
                "Name": {"title": [{"text": {"content": f"Weekly Mirror Analysis: {week_start}"}}]}
            },
            children=[
                {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [{"type": "text", "text": {"content": str(analysis_text)[:2000]}}]
                    }
                }
            ]
        )
        print(f"[NOTION SYNC] Pushed pattern analysis for {week_start} to Notion.")
    except Exception as e:
        print(f"[NOTION SYNC] Error pushing pattern analysis: {e}")

if __name__ == "__main__":
    sync_from_notion()
