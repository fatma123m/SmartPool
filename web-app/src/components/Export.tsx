import React from "react";
import { Button } from "@mui/material";
import { firestore } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import 'jspdf-autotable';

const ExportButtons: React.FC = () => {
  const exportCSV = async () => {
    const snapshot = await getDocs(collection(firestore, "PiscineProcessed"));
    const data = snapshot.docs.map(doc => doc.data());
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Piscine");
    XLSX.writeFile(wb, "PiscineData.csv");
  };

  const exportPDF = async () => {
    const snapshot = await getDocs(collection(firestore, "PiscineProcessed"));
    const data = snapshot.docs.map(doc => doc.data());
    const doc = new jsPDF();
    doc.text("Piscine Data", 14, 20);
    //@ts-ignore
    doc.autoTable({ head: [Object.keys(data[0] || {})], body: data.map(Object.values) });
    doc.save("PiscineData.pdf");
  };

  return (
    <>
      <Button variant="outlined" onClick={exportCSV} sx={{ mr: 2 }}>Export CSV</Button>
      <Button variant="outlined" onClick={exportPDF}>Export PDF</Button>
    </>
  );
};

export default ExportButtons;
