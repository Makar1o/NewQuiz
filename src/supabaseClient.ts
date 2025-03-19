import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://hqxslbcialiepvdmfoua.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxeHNsYmNpYWxpZXB2ZG1mb3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMTIzNTksImV4cCI6MjA1Nzc4ODM1OX0.XRC9zsTvL6s3PHzIobixc29XiVqgHFrfmY9jfP-uJ9o"
);

export default supabase;
