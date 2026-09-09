"""Application entry points shared by the CLI and future HTTP adapters."""

from boardlint.services.review import review_file

__all__ = ['review_file']
