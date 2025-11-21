import React from "react";
import MediaPicker from "../MediaPicker/MediaPicker";
import { useRequireAdminAuth } from "../useRequireAdminAuth";

import "./MediaLibraryPage.scss";

const MediaLibraryPage: React.FC = () => {
  const authReady = useRequireAdminAuth();

  if (!authReady) {
    return (
      <div className="media-library-page">
        <div className="media-library-page__loading">Checking access...</div>
      </div>
    );
  }

  return (
    <div className="media-library-page">
      <div className="media-library-page__header">
        <div>
          <h1 className="media-library-page__title">Media manager</h1>
          <p className="media-library-page__subtitle">
            Full-screen workspace for browsing, uploading and tagging assets.
          </p>
        </div>
        <div className="media-library-page__hint">
          Use filters and the bulk tag editor to keep the library organized.
        </div>
      </div>

      <div className="media-library-page__picker">
        <MediaPicker
          isOpen
          variant="embedded"
          showSearch={false}
          enableBulkEditing
          title="Media library"
          subtitle="Manage uploads, filters and tags in one place."
        />
      </div>
    </div>
  );
};

export default MediaLibraryPage;

