"use client";
import React, { useState } from "react";

const Upload = () => {
  const [file, setFile] = useState(null);

  return (
    <div>
      <input
        onChange={(e: any) => {
          console.log("File selected", e.target.files[0]);

          setFile(e.target.files[0]);
        }}
        type="file"
        name=""
        id=""
      />
    </div>
  );
};

export default Upload;
