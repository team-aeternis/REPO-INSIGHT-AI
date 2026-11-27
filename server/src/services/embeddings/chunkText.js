export const chunkText = (text, chunkSize = 700, overlap = 100) => {
   const source = String(text || "");
   if (!source) return [];

   const chunks = [];
   let start = 0;

   while (start < source.length) {
      let end = Math.min(start + chunkSize, source.length);

      // Keep code blocks and declarations intact when there is a nearby newline.
      if (end < source.length) {
         const lineBreak = source.lastIndexOf("\n", end);
         if (lineBreak > start + Math.floor(chunkSize * 0.6)) end = lineBreak + 1;
      }

      const chunk = source.slice(start, end).trim();
      if (chunk) chunks.push(chunk);
      if (end >= source.length) break;

      const nextStart = Math.max(start + 1, end - Math.max(0, overlap));
      const overlapLineBreak = source.indexOf("\n", nextStart);
      start = overlapLineBreak > nextStart && overlapLineBreak < end
         ? overlapLineBreak + 1
         : nextStart;
   }

   return chunks;
};
