import os
import re

root_dir = r"c:\PROJECT\WEBSITE\IELC-CRM\app"

def get_correct_namespace(file_path):
    rel_path = os.path.relpath(file_path, root_dir)
    dir_name = os.path.dirname(rel_path)
    if dir_name == ".":
        return "App"
    return "App\\" + dir_name.replace(os.sep, "\\")

ns_map = {} # OldClassFull -> NewClassFull

# Pass 1: Build the map
for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(".php"):
            path = os.path.join(root, file)
            class_name = os.path.splitext(file)[0]
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
            except:
                continue
            
            correct_ns = get_correct_namespace(path)
            match = re.search(r"namespace\s+(App[^\s;]+);", content)
            if match:
                current_ns = match.group(1)
                if current_ns != correct_ns:
                    old_full = f"{current_ns}\\{class_name}"
                    new_full = f"{correct_ns}\\{class_name}"
                    ns_map[old_full] = new_full

# Pass 2: Update files
for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(".php"):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
            except:
                continue
            
            new_content = content
            for old, new in ns_map.items():
                new_content = new_content.replace(f"use {old};", f"use {new};")
                new_content = new_content.replace(f"\\{old}", f"\\{new}")
            
            correct_ns = get_correct_namespace(path)
            new_content = re.sub(r"namespace\s+App[^\s;]+;", lambda m: f"namespace {correct_ns};", new_content)
            
            if new_content != content:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated {path}")
