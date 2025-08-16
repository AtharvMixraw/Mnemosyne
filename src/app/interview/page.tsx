"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AddInterview() {
  const [heading, setHeading] = useState("");
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState(false);
  const [mode, setMode] = useState("online");
  const [position, setPosition] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("interview_experiences").insert([
      {
        user_id: user.id, // ✅ matches policy (auth.uid())
        heading,
        content,
        selected,
        mode,
        position,
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      alert("Error saving experience: " + error.message);
    } else {
      alert("Experience saved!");
      router.push("/dashboard");
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Write Interview Experience</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Heading"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <textarea
          placeholder="Write your experience..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border p-2 rounded h-32"
          required
        />
        <input
          type="text"
          placeholder="Position"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="border p-2 rounded"
        />

        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              value="online"
              checked={mode === "online"}
              onChange={() => setMode("online")}
            />{" "}
            Online
          </label>
          <label>
            <input
              type="radio"
              value="offline"
              checked={mode === "offline"}
              onChange={() => setMode("offline")}
            />{" "}
            Offline
          </label>
        </div>

        <label>
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => setSelected(e.target.checked)}
          />{" "}
          Selected
        </label>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Save
        </button>
      </form>
    </div>
  );
}
