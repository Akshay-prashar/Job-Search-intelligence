import unittest
import httpx
import json

BASE_URL = "http://localhost:8000"
API_KEY = "internal-secret-key"
HEADERS = {"X-API-KEY": API_KEY, "Content-Type": "application/json"}


class TestAPIIntegration(unittest.TestCase):
    """End-to-end integration tests hitting the running FastAPI microservice using httpx."""

    @classmethod
    def setUpClass(cls):
        # Verify microservice is reachable
        try:
            with httpx.Client(timeout=5.0) as client:
                res = client.get(f"{BASE_URL}/health")
                cls.server_available = (res.status_code == 200)
        except Exception:
            cls.server_available = False

    def setUp(self):
        if not self.server_available:
            self.skipTest(f"FastAPI microservice not reachable at {BASE_URL}")
        self.client = httpx.Client(timeout=10.0)

    def tearDown(self):
        if hasattr(self, "client"):
            self.client.close()

    # --- Health & Auth ---

    def test_health_endpoint(self):
        res = self.client.get(f"{BASE_URL}/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "healthy")
        self.assertIn("model_loaded", data)
        self.assertIn("timestamp", data)

    def test_auth_missing_api_key(self):
        # Protected route without X-API-KEY returns 403
        res = self.client.post(
            f"{BASE_URL}/skills/extract",
            headers={"Content-Type": "application/json"},
            json={"text": "Python React"}
        )
        self.assertEqual(res.status_code, 403)

    def test_auth_wrong_api_key(self):
        # Protected route with wrong X-API-KEY returns 403
        res = self.client.post(
            f"{BASE_URL}/skills/extract",
            headers={"X-API-KEY": "invalid-token", "Content-Type": "application/json"},
            json={"text": "Python React"}
        )
        self.assertEqual(res.status_code, 403)

    # --- Skills & Summarization ---

    def test_skills_extract_success(self):
        res = self.client.post(
            f"{BASE_URL}/skills/extract",
            headers=HEADERS,
            json={"text": "Looking for senior Python and React engineer with PostgreSQL experience"}
        )
        self.assertEqual(res.status_code, 200)
        skills = res.json().get("skills", [])
        self.assertIn("python", skills)
        self.assertIn("react", skills)
        self.assertIn("postgresql", skills)

    def test_skills_extract_no_skills(self):
        res = self.client.post(
            f"{BASE_URL}/skills/extract",
            headers=HEADERS,
            json={"text": "The quick brown fox jumps over the lazy dog."}
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json().get("skills"), [])

    def test_summarize_endpoint(self):
        res = self.client.post(
            f"{BASE_URL}/summarize",
            headers=HEADERS,
            json={
                "text": "Stripe builds economic infrastructure for the internet. Software engineers at Stripe design scalable APIs. The engineering culture values high rigor and user focus. Candidates should expect deep systems and architecture interviews.",
                "max_sentences": 2
            }
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("summary", res.json())
        self.assertTrue(len(res.json()["summary"]) > 0)

    # --- Taxonomy Endpoints ---

    def test_taxonomy_extract(self):
        res = self.client.post(
            f"{BASE_URL}/taxonomy/extract",
            headers=HEADERS,
            json={"text": "Proficient in Docker containerization and Kubernetes orchestration"}
        )
        self.assertEqual(res.status_code, 200)
        terms = res.json().get("extracted_terms", [])
        self.assertTrue(len(terms) >= 1)
        canonicals = [t["canonical"] for t in terms]
        self.assertIn("docker", canonicals)

    def test_taxonomy_extract_empty(self):
        res = self.client.post(
            f"{BASE_URL}/taxonomy/extract",
            headers=HEADERS,
            json={"text": ""}
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json().get("extracted_terms"), [])

    def test_taxonomy_link(self):
        res = self.client.post(
            f"{BASE_URL}/taxonomy/link",
            headers=HEADERS,
            json={"terms": ["reactjs", "unknownskill999"]}
        )
        self.assertEqual(res.status_code, 200)
        nodes = res.json().get("linked_nodes", [])
        self.assertEqual(len(nodes), 2)
        self.assertEqual(nodes[0]["canonical"], "react")
        self.assertEqual(nodes[0]["source_method"], "dictionary_alias_lookup")
        self.assertEqual(nodes[1]["category"], "Unclassified")

    # --- Embedding Endpoints ---

    def test_embed_text(self):
        res = self.client.post(
            f"{BASE_URL}/embed/text",
            headers=HEADERS,
            json={"text": "Software engineer with 2 years of experience"}
        )
        self.assertEqual(res.status_code, 200)
        emb = res.json().get("embedding", [])
        self.assertEqual(len(emb), 384)

    def test_embed_composite_resume(self):
        res = self.client.post(
            f"{BASE_URL}/embed/resume",
            headers=HEADERS,
            json={
                "summary": "Full stack developer",
                "skills": ["React", "Node.js"],
                "experience": [{"role": "Intern", "company": "Acme", "description": "Built APIs"}],
                "projects": [{"name": "Portfolio", "description": "Personal website"}],
                "education": [{"degree": "B.Tech", "college": "IIT"}]
            }
        )
        self.assertEqual(res.status_code, 200)
        emb = res.json().get("embedding", [])
        self.assertEqual(len(emb), 384)

    def test_embed_composite_job(self):
        res = self.client.post(
            f"{BASE_URL}/embed/job",
            headers=HEADERS,
            json={
                "title": "Backend Software Engineer",
                "description": "Design resilient microservices",
                "required_skills": ["Python", "FastAPI", "PostgreSQL"],
                "preferred_skills": ["Docker", "Kubernetes"]
            }
        )
        self.assertEqual(res.status_code, 200)
        emb = res.json().get("embedding", [])
        self.assertEqual(len(emb), 384)

    # --- Matching Endpoints ---

    def test_match_compute(self):
        payload = {
            "job_title": "Junior Full Stack Engineer",
            "company_name": "Tech Corp",
            "user_skills": ["react", "typescript", "node.js"],
            "job_required_skills": ["react", "typescript"],
            "job_preferred_skills": ["docker"],
            "job_experience_level": "entry",
            "execute_rerank": False
        }
        res = self.client.post(f"{BASE_URL}/match/compute", headers=HEADERS, json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("match_score", data)
        self.assertIn("taxonomy_score", data)
        self.assertIn("enhanced_retrieval_score", data)
        self.assertIn("final_score", data)
        self.assertIn("factor_scores", data)
        self.assertIn("explanation", data)

    def test_match_compute_with_rerank(self):
        payload = {
            "job_title": "Frontend Engineer",
            "company_name": "Startup Inc",
            "user_skills": ["react", "typescript"],
            "job_required_skills": ["react", "typescript"],
            "resume_text": "Experienced building responsive UI with React and TypeScript.",
            "job_experience_level": "entry",
            "execute_rerank": True
        }
        res = self.client.post(f"{BASE_URL}/match/compute", headers=HEADERS, json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("rerank_score", data)
        self.assertTrue(len(data["explanation"]["strengths"]) >= 1)

    def test_match_batch(self):
        payload = {
            "user_skills": ["python", "fastapi"],
            "target_roles": ["backend"],
            "jobs": [
                {
                    "id": "job-1",
                    "job_title": "Backend Python Developer",
                    "company_name": "Alpha Corp",
                    "skills_json": ["python", "fastapi"],
                    "required_skills": ["python", "fastapi"],
                    "experience_level": "entry"
                },
                {
                    "id": "job-2",
                    "job_title": "Senior Staff Architect",
                    "company_name": "Beta Corp",
                    "skills_json": ["c++", "embedded"],
                    "required_skills": ["c++", "embedded"],
                    "experience_level": "senior"
                }
            ],
            "top_k": 2
        }
        res = self.client.post(f"{BASE_URL}/match/batch", headers=HEADERS, json=payload)
        self.assertEqual(res.status_code, 200)
        results = res.json().get("results", [])
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]["job_id"], "job-1")
        self.assertGreater(results[0]["final_score"], results[1]["final_score"])

    def test_match_rerank_standalone(self):
        payload = {
            "candidate": {
                "job_title": "React Developer",
                "description": "Frontend UI development",
                "required_skills": ["react", "typescript"],
                "matched_skills": ["react"],
                "missing_required": ["typescript"],
                "enhanced_score": 75.0
            },
            "resume_skills": ["react"],
            "resume_text": "Built enterprise frontend with React."
        }
        res = self.client.post(f"{BASE_URL}/match/rerank", headers=HEADERS, json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("rerank_score", data)
        self.assertIn("decision", data)
        self.assertIn("strengths", data)
        self.assertIn("gaps", data)

    def test_match_validate_explanation(self):
        payload = {
            "strengths": [{"claim": "React mastery", "evidence": "Built high performance React web app"}],
            "gaps": [{"claim": "Missing Kubernetes", "evidence": None}],
            "resume_text": "Built high performance React web app for e-commerce client.",
            "job_text": "Looking for React developer."
        }
        res = self.client.post(f"{BASE_URL}/match/validate-explanation", headers=HEADERS, json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        v_strengths = data.get("validated_strengths", [])
        self.assertTrue(v_strengths[0]["verified"])

    # --- Ingestion Endpoints ---

    def test_ingestion_status(self):
        res = self.client.get(f"{BASE_URL}/ingestion/status", headers=HEADERS)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("status", data)
        self.assertIn("jobs_processed", data)
        self.assertIn("duplicates_found", data)


if __name__ == "__main__":
    unittest.main()
