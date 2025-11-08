.PHONY: zip clean help

# Extension name and version (from manifest.json)
NAME = recent-frequent-bookmarks
VERSION = $(shell grep '"version"' manifest.json | sed 's/.*"\([0-9.]*\)".*/\1/')
ZIP_NAME = $(NAME)-$(VERSION).zip

# Files to include in the extension zip
EXTENSION_FILES = manifest.json \
                  popup.html \
                  popup.css \
                  popup.js \
                  icons

help:
	@echo "Available targets:"
	@echo "  make zip    - Create extension zip file for Chrome Web Store"
	@echo "  make clean  - Remove generated zip files"
	@echo "  make help   - Show this help message"

zip: clean
	@echo "Creating $(ZIP_NAME)..."
	@zip -r $(ZIP_NAME) $(EXTENSION_FILES)
	@echo "✓ Created $(ZIP_NAME)"
	@echo "Size: $$(du -h $(ZIP_NAME) | cut -f1)"

clean:
	@echo "Cleaning up zip files..."
	@rm -f *.zip
	@echo "✓ Cleaned"
