export type Finding = { id:string; title:string; object_id:string; object_kind:string; net_name:string; layer:string; location:{x:number;y:number}; measured_value:number; threshold:number; unit:string; message:string; why_it_matters:string; suggested_action:string; confidence:string; severity:string };
export type Report = { status:string; board:{components:number;tracks:number;vias:number;layers:number;format_version:number}; findings:Finding[]; limitations:string[]; rules_executed:{id:string;version:string;parameters:{minimum_mm:number}}[] };
export const MAX_BYTES = 25 * 1024 * 1024;
export function validateFile(file: {name:string;size:number}) {
  if (file.name.toLowerCase().endsWith('.kicad_sch')) return 'This is a schematic. Save the board from KiCad’s PCB Editor and choose the .kicad_pcb file.';
  if (!file.name.toLowerCase().endsWith('.kicad_pcb')) return 'Choose a .kicad_pcb board layout. Images, PDFs and ZIP files are not supported.';
  if (!file.size) return 'This file is empty. Choose a saved PCB layout.';
  if (file.size > MAX_BYTES) return 'This file exceeds the 25 MiB limit.';
  return null;
}
