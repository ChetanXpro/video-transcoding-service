"use client";
import React, { useState } from "react";

const Upload = () => {
  const [file, setFile] = useState<File>();

  const DUMMY_USER_LIST: {
    [key: string]: string;
  } = {
    CHETAN: "12345",
    AKASH: "54321",
    SAGAR: "00000",
  };

  const [preSignedUrl, setPreSignedUrl] = useState("");
  const [user, setUser] = useState<any>();

  console.log("user", user);

  type PreSignedUrlRequest = {
    post: string;
    type: string;
    userID: string;
  };

  const FUNCTION_URL = process.env.NEXT_PUBLIC_UPLOAD_FUNCTION_URL ?? "";

  if (!FUNCTION_URL) alert("No FUNCTION_URL env var set");

  const getPreSignedUrl = async () => {
    if (!user) return alert("Please select a user");
    const data = {
      post: "teacher",
      type: file?.type ?? "",
      userID: DUMMY_USER_LIST[user] ?? DUMMY_USER_LIST[0],
    } satisfies PreSignedUrlRequest;
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      body: JSON.stringify(data),
    });

    const { url } = await response.json();

    return url;
  };

  const uploadFile = async () => {
    const url = await getPreSignedUrl();
    if (!url) {
      return alert("Error getting pre-signed URL.");
    }

    if (!file) {
      return alert("No file selected.");
    }
    fetch(url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file?.type ?? "",
      },
    })
      .then((response) => {
        if (response.ok) {
          alert("File uploaded successfully!");
        } else {
          alert("File upload failed.");
        }
      })
      .catch((error) => {
        console.error("Error uploading file:", error);
      });
  };

  return (
    <div className="flex flex-col gap-10 items-center justify-between">
      <input
        onChange={(e: any) => {
          console.log("File selected", e.target.files[0]);

          setFile(e.target.files[0]);
        }}
        type="file"
        name=""
        id=""
      />
      <div>
        <select
          className="bg-black text-white"
          onChange={(e) => setUser(e.target.value)}
        >
          {Object.keys(DUMMY_USER_LIST).map((user) => (
            <option value={user}>{user}</option>
          ))}
        </select>
      </div>
      <button className="py-3 px-5 border border-dotted" onClick={uploadFile}>
        Upload
      </button>
    </div>
  );
};

export default Upload;
