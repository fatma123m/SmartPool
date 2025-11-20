import React, { useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { firestore } from "../firebase";
import { useSnackbar } from "notistack";

const Alerts: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const alertsCol = collection(firestore, "alerts");
    const unsubscribe = onSnapshot(alertsCol, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === "added") {
          const alert = change.doc.data().alert;
          enqueueSnackbar(alert, { variant: "error", anchorOrigin: { vertical: "top", horizontal: "right" } });
        }
      });
    });
    return () => unsubscribe();
  }, [enqueueSnackbar]);

  return null;
};

export default Alerts;
