import React from "react";
import { createBrowserRouter } from "react-router-dom";
import queryClient from "./query-client";
import ErrorPage from "@/ErrorPage";
import Root from "@/routes/root";
import Index from "@/routes/index";
import Genshin, { loader as genshinLoader } from "@/routes/genshin";
import StarRail, { loader as starrailLoader } from "@/routes/starrail";
import Setting from "@/routes/setting";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Index /> },
      {
        path: "/genshin",
        element: <Genshin />,
        loader: genshinLoader(queryClient),
      },
      {
        path: "/starrail",
        element: <StarRail />,
        loader: starrailLoader(queryClient),
      },
      {
        path: "/setting",
        element: <Setting />,
        // TODO: loader: settingLoader(queryClient)
      },
    ],
  },
]);

export default router;
