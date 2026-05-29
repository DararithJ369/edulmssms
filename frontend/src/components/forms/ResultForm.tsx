"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { Dispatch, SetStateAction, useEffect } from "react";
import { resultSchema, ResultSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createResult, updateResult } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const ResultForm = ({
  type,
  data,
  setOpen,
  relatedData = {},
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResultSchema>({
    resolver: zodResolver(resultSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createResult : updateResult,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    formAction(data);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Result has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { students = [], exams = [], assignments = [], teachers = [] } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Grade a Student" : "Update Student Grade"}
      </h1>
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Student</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("studentId")}
            defaultValue={data?.studentId || data?.student_id}
          >
            {students.map((s: { id: string; name: string; surname: string }) => (
              <option value={s.id} key={s.id}>
                {s.name + " " + s.surname}
              </option>
            ))}
          </select>
          {errors.studentId?.message && (
            <p className="text-xs text-red-400">
              {errors.studentId.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Exam (Optional)</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("examId")}
            defaultValue={data?.examId || data?.exam_id || ""}
          >
            <option value="">None</option>
            {exams.map((e: { id: number; title: string }) => (
              <option value={e.id} key={e.id}>
                {e.title}
              </option>
            ))}
          </select>
          {errors.examId?.message && (
            <p className="text-xs text-red-400">
              {errors.examId.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Assignment (Optional)</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("assignmentId")}
            defaultValue={data?.assignmentId || data?.assignment_id || ""}
          >
            <option value="">None</option>
            {assignments.map((a: { id: number; title: string }) => (
              <option value={a.id} key={a.id}>
                {a.title}
              </option>
            ))}
          </select>
          {errors.assignmentId?.message && (
            <p className="text-xs text-red-400">
              {errors.assignmentId.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Graded By</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("gradedBy")}
            defaultValue={data?.gradedBy || data?.graded_by}
          >
            {teachers.map((t: { id: string; name: string; surname: string }) => (
              <option value={t.id} key={t.id}>
                {t.name + " " + t.surname}
              </option>
            ))}
          </select>
          {errors.gradedBy?.message && (
            <p className="text-xs text-red-400">
              {errors.gradedBy.message.toString()}
            </p>
          )}
        </div>
        <InputField
          label="Score Obtained"
          name="score"
          type="number"
          defaultValue={data?.score}
          register={register}
          error={errors.score}
        />
        <InputField
          label="Total Marks"
          name="totalMarks"
          type="number"
          defaultValue={data?.totalMarks || data?.total_marks}
          register={register}
          error={errors.totalMarks}
        />
        <InputField
          label="Grade Letter"
          name="grade"
          defaultValue={data?.grade}
          register={register}
          error={errors.grade}
        />
        <div className="flex items-center gap-2 w-full md:w-1/4 pt-4">
          <input
            type="checkbox"
            id="isPassed"
            className="w-4 h-4 rounded ring-2 ring-blue-400"
            {...register("isPassed")}
            defaultChecked={data?.isPassed ?? data?.is_passed}
          />
          <label htmlFor="isPassed" className="text-sm text-gray-700 select-none">
            Is Student Passed?
          </label>
        </div>
        {data && (
          <InputField
            label="Id"
            name="id"
            defaultValue={data?.id}
            register={register}
            error={errors?.id}
            hidden
          />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500 font-medium">Feedback</label>
        <textarea
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full h-32"
          {...register("feedback")}
          defaultValue={data?.feedback}
        />
        {errors.feedback?.message && (
          <p className="text-xs text-red-400">
            {errors.feedback.message.toString()}
          </p>
        )}
      </div>
      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button type="submit" className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Submit Grade" : "Update Grade"}
      </button>
    </form>
  );
};

export default ResultForm;
