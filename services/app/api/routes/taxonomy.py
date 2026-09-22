from fastapi import APIRouter, Depends
from app.api.deps import api_key
from app.models.schemas import (
    TaxonomyExtractRequest,
    TaxonomyExtractResponse,
    TaxonomyLinkRequest,
    TaxonomyLinkResponse
)
from app.services.taxonomy_service import TaxonomyService

router = APIRouter(prefix="/taxonomy", tags=["taxonomy"])
taxonomy_service = TaxonomyService()

@router.post("/extract", response_model=TaxonomyExtractResponse, dependencies=[api_key])
async def extract_taxonomy_terms(req: TaxonomyExtractRequest):
    """Extract candidate skills, occupations, and qualifications from text with evidence spans."""
    terms = taxonomy_service.extract_candidate_spans(req.text)
    return TaxonomyExtractResponse(extracted_terms=terms)

@router.post("/link", response_model=TaxonomyLinkResponse, dependencies=[api_key])
async def link_taxonomy_terms(req: TaxonomyLinkRequest):
    """Map free-text terms to canonical ESCO taxonomy nodes with confidence score."""
    linked = taxonomy_service.link_terms(req.terms)
    return TaxonomyLinkResponse(linked_nodes=linked)
