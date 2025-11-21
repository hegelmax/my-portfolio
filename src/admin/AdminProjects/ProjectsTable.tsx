import React from "react";
import { type Project } from "./AdminProjectsTypes";

type Props = {
  items: Project[];
  deletingId: number | string | null;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
};

export const ProjectsTable: React.FC<Props> = ({
  items,
  deletingId,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="projects-table-wrapper">
      <table className="projects-table">
        <thead>
          <tr>
            <th style={{ width: "50px" }}>ID</th>
            <th>Cover</th>
            <th>Title</th>
            <th>Slug</th>
            <th>Category</th>
            <th>Selected</th>
            <th style={{ width: "130px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id ?? `temp-${p.slug}`}>
              <td>{p.id}</td>
              <td>
                {p.coverImage ? (
                  <img
                    src={
                      p.coverImage.startsWith("/")
                        ? p.coverImage
                        : `/img/${p.coverImage.replace(/^img\//, "")}`
                    }
                    alt=""
                    className="projects-table__cover"
                  />
                ) : (
                  <div className="projects-table__cover projects-table__cover--empty">
                    —
                  </div>
                )}
              </td>
              <td>{p.title}</td>
              <td>
                <code>{p.slug}</code>
              </td>
              <td>{p.category || "—"}</td>
              <td>{p.selected ? "Yes" : "No"}</td>
              <td>
                <div className="projects-table__actions">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => onEdit(p)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-ghost--danger"
                    onClick={() => onDelete(p)}
                    disabled={deletingId === p.id}
                  >
                    {deletingId === p.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
