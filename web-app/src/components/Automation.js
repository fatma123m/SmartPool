import React, { useEffect, useState } from "react";
import { firestore } from "../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";

export default function Automation() {
  const [rules, setRules] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, "automationRules"), snapshot => {
      const loadedRules = snapshot.docs.map(doc => doc.data());
      setRules(loadedRules);
    });
    return () => unsub();
  }, []);

  return (
    <div>
      <h3>Règles d'automatisation</h3>
      {rules.map((rule, i) => (
        <div key={i}>
          <b>{rule.name}</b> - Active: {rule.active ? "Oui" : "Non"}
        </div>
      ))}
    </div>
  );
}
