import os
import re
import json
from typing import List, Dict

# Base built-in taxonomy
SKILL_SYNONYMS = {
    "javascript": ["js", "ecmascript", "es6", "es2015", "es2020"],
    "typescript": ["ts"],
    "react": ["reactjs", "react.js", "react js"],
    "node.js": ["nodejs", "node", "node js"],
    "python": ["python3", "python2", "py"],
    "postgresql": ["postgres", "psql", "pg"],
    "mongodb": ["mongo"],
    "machine learning": ["ml", "machine-learning"],
    "deep learning": ["dl", "deep-learning"],
    "natural language processing": ["nlp"],
    "artificial intelligence": ["ai"],
    "amazon web services": ["aws"],
    "google cloud platform": ["gcp", "google cloud"],
    "microsoft azure": ["azure"],
    "docker": ["containerization", "containers"],
    "kubernetes": ["k8s"],
    "data structures": ["dsa", "data structures and algorithms", "algorithms"],
    "ci/cd": ["cicd", "continuous integration", "continuous deployment", "github actions"],
    "git": ["github", "gitlab"],
    "html": ["html5"],
    "css": ["css3", "sass", "scss", "less"],
    "tailwind css": ["tailwind"],
    "sql": ["mysql", "sqlite", "relational database"],
    "redis": ["caching"],
    "c++": ["cpp", "c plus plus"],
    "c#": ["csharp", "c sharp"],
    "java": ["jvm"],
    "golang": ["go lang", "go"],
    "rust": ["rustlang"],
    "vue.js": ["vue", "vuejs"],
    "angular": ["angularjs", "angular.js"],
    "next.js": ["nextjs"],
    "nest.js": ["nestjs"],
    "express.js": ["express", "expressjs"],
    "django": ["flask", "fastapi"],
    "spring boot": ["spring", "springboot"],
    "graphql": ["gql"],
    "terraform": ["infrastructure as code", "iac"]
}

SKILL_CATEGORIES = {
    "Languages": ["javascript", "typescript", "python", "c++", "c#", "java", "golang", "rust", "html", "css", "sql"],
    "Frameworks": ["react", "next.js", "nest.js", "express.js", "django", "spring boot", "vue.js", "angular", "tailwind css"],
    "Databases": ["postgresql", "mongodb", "redis"],
    "Tools": ["git", "docker", "kubernetes", "terraform"],
    "Concepts": ["machine learning", "deep learning", "natural language processing", "artificial intelligence", "data structures", "ci/cd", "graphql"]
}

# Dynamically load from services/data/skill_taxonomy.json if present
try:
    _json_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "skill_taxonomy.json")
    if os.path.exists(_json_path):
        with open(_json_path, "r", encoding="utf-8") as _f:
            _ext_data = json.load(_f)
            for _skill, _meta in _ext_data.items():
                if _skill not in SKILL_SYNONYMS:
                    SKILL_SYNONYMS[_skill] = _meta.get("aliases", [])
                _cat = _meta.get("category", "Concepts")
                if _cat in SKILL_CATEGORIES and _skill not in SKILL_CATEGORIES[_cat]:
                    SKILL_CATEGORIES[_cat].append(_skill)
except Exception:
    pass

def normalize_skill(skill: str) -> str:
    """Normalize a skill name to its canonical form."""
    skill_lower = skill.lower().strip()
    for canonical, aliases in SKILL_SYNONYMS.items():
        if skill_lower == canonical or skill_lower in aliases:
            return canonical
    return skill_lower

def extract_skills_from_text(text: str) -> List[str]:
    """Search for skills in the text based on the taxonomy."""
    text_lower = text.lower()
    extracted = set()
    
    # 1. First, search for canonical skills and their synonyms
    for canonical, aliases in SKILL_SYNONYMS.items():
        # Build search patterns to prevent sub-string matching e.g. "go" in "good"
        patterns = [canonical] + aliases
        for pattern in patterns:
            # Escape pattern for safe regex matching (e.g. c++)
            escaped_pattern = re.escape(pattern)
            # Match word boundary. Special handling for c++ and c# since boundaries are tricky
            if '++' in pattern or '#' in pattern:
                regex = rf"(?:^|\s|\b){escaped_pattern}(?:$|\s|\b|[.,;])"
            else:
                regex = rf"\b{escaped_pattern}\b"
                
            if re.search(regex, text_lower):
                extracted.add(canonical)
                break
                
    return sorted(list(extracted))

def get_category(skill: str) -> str:
    """Get the category of a normalized skill."""
    norm = normalize_skill(skill)
    for category, skills in SKILL_CATEGORIES.items():
        if norm in skills:
            return category
    return "Other"
class SkillTaxonomy:
    normalize = staticmethod(normalize_skill)
    extract = staticmethod(extract_skills_from_text)
    category = staticmethod(get_category)
