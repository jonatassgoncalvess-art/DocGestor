-- DocGestor by Carminatti
-- Ordem recomendada para atualizar ou restaurar o Supabase
--
-- Execute os arquivos abaixo no SQL Editor do Supabase, nesta ordem.
-- Este arquivo é apenas um guia de execução.

-- PARTE 1 - Base administrativa, cadastros, usuários, agenda, envios e configurações
-- Arquivo:
-- sql-00-operacao-completa-docgestor.sql
-- Observação: esta base inclui 01.2.3 Cidades e o vínculo de cidade/endereço aos imóveis.

-- PARTE 2 - Correção final da tabela de processos/licenças ambientais
-- Arquivo:
-- sql-03-1-environmental-licenses-completo.sql

-- PARTE 3 - Fila e histórico de alertas do ambiente 01.4.3
-- Arquivo:
-- sql-01-4-3-alert-queue-correcao.sql

-- CORREÇÃO RÁPIDA - Execute apenas se o Supabase retornar:
-- "Could not find the table 'public.cities' in the schema cache"
-- Arquivo:
-- sql-01-2-3-cidades-correcao-schema-cache.sql

-- Observação:
-- Os demais SQLs menores permanecem no repositório como histórico por módulo,
-- mas os três arquivos principais acima são o conjunto recomendado para alinhar
-- o sistema atual com o Supabase.
