import re
from typing import List

class TextSummarizer:
    @staticmethod
    def clean_html(html: str) -> str:
        """Strip HTML tags using regex to avoid external dependency issues."""
        if not html:
            return ""
        # Remove script and style elements
        html = re.sub(r'<(script|style).*?>.*?</\1>', '', html, flags=re.IGNORECASE|re.DOTALL)
        # Remove all other tags
        text = re.sub(r'<[^>]*>', ' ', html)
        # Normalize spaces
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def summarize(self, text: str, max_sentences: int = 5) -> str:
        cleaned_text = self.clean_html(text)
        if not cleaned_text:
            return ""
            
        # Split into sentences using a regex pattern
        sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', cleaned_text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
        
        if len(sentences) <= max_sentences:
            return " ".join(sentences)
            
        # Scoring sentences based on keywords and position
        scored_sentences = []
        important_keywords = ["hiring", "interview", "engineer", "culture", "react", "python", "skills", "experience", "requirements", "responsibilities"]
        
        for idx, sentence in enumerate(sentences):
            score = 0.0
            
            # Position score: earlier sentences in a paragraph are usually more informational
            score += 1.0 / (idx + 1)
            
            # Keyword matching score
            sent_lower = sentence.lower()
            for kw in important_keywords:
                if kw in sent_lower:
                    score += 1.0
                    
            # Length penalty/bonus: prefer sentences between 15 and 40 words
            words = sent_lower.split()
            if 15 <= len(words) <= 40:
                score += 1.5
            elif len(words) < 5:
                score -= 2.0  # penalize very short
                
            scored_sentences.append((score, sentence, idx))
            
        # Sort sentences by score, extract top-N, and restore original sequence order
        scored_sentences.sort(key=lambda x: x[0], reverse=True)
        top_sentences = scored_sentences[:max_sentences]
        top_sentences.sort(key=lambda x: x[2])  # restore sequence
        
        return " ".join([item[1] for item in top_sentences])

ExtractiveSummarizer = TextSummarizer
