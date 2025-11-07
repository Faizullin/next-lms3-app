"use client";

import { GeneralRouterOutputs } from "@/server/api/types";
import { trpc } from "@/utils/trpc";
import { useParams } from "next/navigation";
import { createContext, ReactNode, useContext, useState } from "react";


type SerializedCourse = GeneralRouterOutputs["lmsModule"]["courseModule"]["course"]["publicGetByIdDetailed"];

const useLoadCoursePublicDetailedQuery = ({
    courseId,   
}: {
    courseId: string;
    lessonId?: string;
}) => {
    return trpc.lmsModule.courseModule.course.publicGetByIdDetailed.useQuery(
        { id: courseId },
        { enabled: !!courseId }
    );
}

const useLoadLessonPublicQuery = ({
    courseId,
    lessonId,
}: {
    courseId: string;
    lessonId?: string;
}) => {
    return trpc.lmsModule.courseModule.lesson.publicGetById.useQuery({ courseId, lessonId: lessonId!, }, { enabled: !!courseId && !!lessonId });
};

type CoursePublicDetailContextType = { 
    isLoading: boolean
    setIsLoading: (loading: boolean) => void;
    loadCoursePublicDetailedQuery: ReturnType<typeof useLoadCoursePublicDetailedQuery>;
    loadLessonPublicQuery: ReturnType<typeof useLoadLessonPublicQuery>;
    initialCourse: SerializedCourse;
}
const CoursePublicDetailContext = createContext<CoursePublicDetailContextType | undefined>(undefined)

export function CoursePublicDetailProvider({ children, initialCourse }: {
    children: ReactNode;
    initialCourse: SerializedCourse;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const params = useParams<{ id: string; lessonId?: string }>();
    const loadCoursePublicDetailedQuery = useLoadCoursePublicDetailedQuery({ courseId: initialCourse._id })

    const loadLessonPublicQuery = useLoadLessonPublicQuery({ courseId: initialCourse._id, lessonId: params.lessonId });

    return (
        <CoursePublicDetailContext.Provider value={{ 
            isLoading,
            setIsLoading,
            loadCoursePublicDetailedQuery,
            loadLessonPublicQuery,
            initialCourse,
        }}>
            {children}
        </CoursePublicDetailContext.Provider>
    );
}

export function useCoursePublicDetail() {
    const context = useContext(CoursePublicDetailContext);
    if (!context) {
        throw new Error("useCoursePublicDetail must be used within a CoursePublicDetailProvider");
    }
    return context;
}