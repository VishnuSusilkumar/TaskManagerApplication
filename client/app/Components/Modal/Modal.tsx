"use client";
import { useTasks } from "@/context/taskContext";
import useDetectOutside from "@/hooks/useDetectOutside";
import React, { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";

function Modal() {
  const {
    isEditing,
    closeModal,
    modalMode,
    activeTask,
    updateTask,
    createTask,
  } = useTasks();
  const ref = React.useRef(null);

  useDetectOutside({
    ref,
    callback: () => {
      if (isEditing) {
        closeModal();
      }
    },
  });

  // Validation schema
  const validationSchema = Yup.object({
    title: Yup.string()
      .required("Title is required")
      .max(50, "Title cannot exceed 50 characters"),
    description: Yup.string()
      .required("Description is required")
      .max(300, "Description cannot exceed 300 characters"),
    priority: Yup.string().required("Priority is required"),
    dueDate: Yup.date().required("Due Date is required").nullable(),
    completed: Yup.boolean().required("Task completion status is required"),
  });

  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      priority: "low",
      dueDate: "",
      completed: false,
    },
    validationSchema,
    onSubmit: (values) => {
      if (modalMode === "edit") {
        updateTask({ ...activeTask, ...values });
      } else if (modalMode === "add") {
        createTask(values);
      }
      closeModal();
    },
  });

  useEffect(() => {
    if (modalMode === "edit" && activeTask) {
      formik.setValues(activeTask); 
    }
  }, [modalMode, activeTask]);

  return (
    <div className="fixed left-0 top-0 z-50 h-full w-full bg-[#333]/30 overflow-hidden flex justify-center items-center">
      <form
        className="modal-task py-5 px-6 w-full max-w-[520px] md:max-w-[400px] sm:max-w-[90%] bg-white rounded-lg shadow-md transform transition-all duration-300"
        onSubmit={formik.handleSubmit}
        ref={ref}
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-sm md:text-base">
            Title
          </label>
          <input
            className={`bg-[#F9F9F9] p-2 rounded-md border ${
              formik.touched.title && formik.errors.title
                ? "border-red-500"
                : ""
            }`}
            type="text"
            id="title"
            placeholder="Task Title"
            name="title"
            value={formik.values.title}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.title && formik.errors.title ? (
            <div className="text-red-500 text-sm">{formik.errors.title}</div>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm md:text-base">
            Description
          </label>
          <textarea
            className={`bg-[#F9F9F9] p-2 rounded-md border ${
              formik.touched.description && formik.errors.description
                ? "border-red-500"
                : ""
            } resize-none text-sm md:text-base`}
            name="description"
            placeholder="Task Description"
            rows={4}
            value={formik.values.description}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.description && formik.errors.description ? (
            <div className="text-red-500 text-sm">
              {formik.errors.description}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="priority" className="text-sm md:text-base">
            Select Priority
          </label>
          <select
            className={`bg-[#F9F9F9] p-2 rounded-md border ${
              formik.touched.priority && formik.errors.priority
                ? "border-red-500"
                : ""
            } cursor-pointer text-sm md:text-base`}
            name="priority"
            value={formik.values.priority}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            <option value="" label="Select priority" />
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          {formik.touched.priority && formik.errors.priority ? (
            <div className="text-red-500 text-sm">{formik.errors.priority}</div>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="dueDate" className="text-sm md:text-base">
            Due Date
          </label>
          <input
            className={`bg-[#F9F9F9] p-2 rounded-md border ${
              formik.touched.dueDate && formik.errors.dueDate
                ? "border-red-500"
                : ""
            } text-sm md:text-base`}
            type="date"
            name="dueDate"
            value={formik.values.dueDate}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.dueDate && formik.errors.dueDate ? (
            <div className="text-red-500 text-sm">{formik.errors.dueDate}</div>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="completed" className="text-sm md:text-base">
            Task Completed
          </label>
          <div className="flex items-center justify-between bg-[#F9F9F9] p-2 rounded-md border">
            <label htmlFor="completed" className="text-sm md:text-base">
              Completed
            </label>
            <div>
              <select
                className={`bg-[#F9F9F9] p-2 rounded-md border ${
                  formik.touched.completed && formik.errors.completed
                    ? "border-red-500"
                    : ""
                } cursor-pointer text-sm md:text-base`}
                name="completed"
                value={formik.values.completed ? "true" : "false"}
                onChange={(e) =>
                  formik.setFieldValue("completed", e.target.value === "true")
                }
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
              {formik.touched.completed && formik.errors.completed ? (
                <div className="text-red-500 text-sm">
                  {formik.errors.completed}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            type="submit"
            className={`text-white py-2 rounded-md w-full hover:bg-blue-500 transition duration-200 ease-in-out ${
              modalMode === "edit" ? "bg-blue-400" : "bg-green-400"
            }`}
          >
            {modalMode === "edit" ? "Update Task" : "Create Task"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Modal;
