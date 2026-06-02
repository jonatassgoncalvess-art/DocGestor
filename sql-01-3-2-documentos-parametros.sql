-- DocGestor by Carminatti - 01.3.2 Documentos
-- Ajuste: parametros tecnicos do documento.

alter table environmental_documents
add column if not exists document_parameters text;
