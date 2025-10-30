import { AppBar, AppBarProps, TitlePortal, useGetIdentity } from "react-admin";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { NotificationsMenu } from "./NotificationsMenu";

export const AdminAppBar = (props: AppBarProps) => {
  const { data } = useGetIdentity();
  const initials = data?.email ? data.email.slice(0, 2).toUpperCase() : "AD";

  return (
    <AppBar
      {...props}
      elevation={0}
      color="default"
      sx={{
        backgroundColor: "#ffffffcc",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
      }}
    >
      <TitlePortal />
      <Box sx={{ flex: 1 }} />
      <Stack direction="row" alignItems="center" spacing={1.5} mr={2}>
        <NotificationsMenu />
        <Box textAlign="right">
          <Typography variant="body2" fontWeight={600} color="text.primary">
            {data?.email || "Administrator"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {data?.role || ""}
          </Typography>
        </Box>
        <Avatar
          sx={{
            bgcolor: "primary.main",
            width: 36,
            height: 36,
            fontWeight: 600,
          }}
        >
          {initials}
        </Avatar>
      </Stack>
    </AppBar>
  );
};
