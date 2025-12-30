-- Add po_id column to projects table
ALTER TABLE projects
ADD COLUMN po_id INT NULL AFTER onsite_manager_id,
ADD CONSTRAINT fk_projects_po
  FOREIGN KEY (po_id) REFERENCES pos(id)
  ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_projects_po_id ON projects(po_id);
