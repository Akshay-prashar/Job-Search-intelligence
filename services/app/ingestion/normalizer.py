import re
from typing import Dict, Any, List
from datetime import datetime
from app.services.skill_taxonomy import extract_skills_from_text
from app.utils.text_cleaning import clean_html

class JobNormalizer:
    def _detect_experience_level(self, title: str, description: str) -> str:
        t = title.lower()
        d = description.lower()
        
        if "intern" in t or "internship" in t:
            return "intern"
        if "senior" in t or "lead" in t or "principal" in t or "staff" in t or "architect" in t:
            return "mid"
        if "junior" in t or "associate" in t:
            return "junior"
        if "fresher" in t or "entry" in t or "grad" in t or "0-2" in d or "0-1" in d:
            return "entry"
            
        return "entry"  # Default to entry since our target audience is freshers

    def _detect_remote(self, location: str) -> str:
        loc = location.lower()
        if "remote" in loc:
            return "remote"
        if "hybrid" in loc:
            return "hybrid"
        if "onsite" in loc or "on-site" in loc:
            return "onsite"
        return "unknown"

    def _detect_role_type(self, title: str) -> str:
        t = title.lower()
        if "frontend" in t or "react" in t or "ui" in t or "web" in t:
            return "frontend"
        if "backend" in t or "go" in t or "python" in t or "server" in t:
            return "backend"
        if "fullstack" in t or "full stack" in t or "full-stack" in t:
            return "fullstack"
        if "devops" in t or "cloud" in t or "infrastructure" in t:
            return "devops"
        if "data" in t or "analyst" in t or "sql" in t:
            return "data"
        if "ml" in t or "machine" in t or "nlp" in t or "intelligence" in t:
            return "ml"
        return "fullstack"  # Default fallback

    def normalize_greenhouse(self, raw: Dict[str, Any], company_name: str) -> Dict[str, Any]:
        description = clean_html(raw.get("content", ""))
        skills = extract_skills_from_text(description)
        title = raw.get("title", "")
        location_dict = raw.get("location", {})
        location_str = location_dict.get("name", "Unknown") if isinstance(location_dict, dict) else str(location_dict)
        
        return {
            "external_job_id": str(raw.get("id")),
            "job_title": title,
            "role_type": self._detect_role_type(title),
            "location": location_str,
            "remote_type": self._detect_remote(location_str + " " + title),
            "experience_level": self._detect_experience_level(title, description),
            "job_type": "full-time" if "intern" not in title.lower() else "internship",
            "department": raw.get("departments", [{}])[0].get("name", "Engineering") if raw.get("departments") else "Engineering",
            "description": description,
            "responsibilities": "",
            "minimum_qualifications": "",
            "preferred_qualifications": "",
            "skills_json": skills,
            "salary_range": "",
            "apply_url": raw.get("absolute_url"),
            "source": "greenhouse",
            "source_url": raw.get("absolute_url"),
            "posted_at": datetime.utcnow(), # fallback to current time
            "confidence_score": 0.90,
            "job_status": "active"
        }

    def normalize_lever(self, raw: Dict[str, Any], company_name: str) -> Dict[str, Any]:
        description = raw.get("descriptionPlain", "")
        skills = extract_skills_from_text(description)
        title = raw.get("text", "")
        location_str = raw.get("categories", {}).get("location", "Unknown")
        
        return {
            "external_job_id": str(raw.get("id")),
            "job_title": title,
            "role_type": self._detect_role_type(title),
            "location": location_str,
            "remote_type": self._detect_remote(location_str + " " + title),
            "experience_level": self._detect_experience_level(title, description),
            "job_type": "full-time" if "intern" not in title.lower() else "internship",
            "department": raw.get("categories", {}).get("department", "Engineering"),
            "description": description,
            "responsibilities": "",
            "minimum_qualifications": "",
            "preferred_qualifications": "",
            "skills_json": skills,
            "salary_range": "",
            "apply_url": raw.get("applyUrl"),
            "source": "lever",
            "source_url": raw.get("hostedUrl"),
            "posted_at": datetime.utcnow(),
            "confidence_score": 0.90,
            "job_status": "active"
        }

    def normalize_github(self, raw: Dict[str, Any], source_repo: str = "") -> Dict[str, Any]:
        title = raw.get("job_title", "")
        location_str = raw.get("location", "Unknown")
        apply_url = raw.get("apply_url", "")
        company = raw.get("company_name", "Unknown")
        description = f"{title} at {company}. Location: {location_str}."
        skills = extract_skills_from_text(description + " " + title)
        
        return {
            "external_job_id": raw.get("external_id") or f"github-{company}-{title}"[:64],
            "company_name": company,
            "job_title": title,
            "role_type": self._detect_role_type(title),
            "location": location_str,
            "remote_type": self._detect_remote(location_str + " " + title),
            "experience_level": self._detect_experience_level(title, description),
            "job_type": "internship" if "intern" in title.lower() else "full-time",
            "department": "Engineering",
            "description": description,
            "responsibilities": "",
            "minimum_qualifications": "",
            "preferred_qualifications": "",
            "skills_json": skills,
            "salary_range": "",
            "apply_url": apply_url,
            "source": "github",
            "source_url": apply_url or f"https://github.com/{source_repo}",
            "posted_at": datetime.utcnow(),
            "confidence_score": 0.70,
            "job_status": "active"
        }
