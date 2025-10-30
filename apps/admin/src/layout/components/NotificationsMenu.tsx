import { type MouseEvent, useMemo, useState } from "react";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useNotificationsCenter } from "./NotificationsProvider";

const formatTimestamp = (value: string): string => {
  try {
    const date = new Date(value);
    return date.toLocaleString();
  } catch (error) {
    return value;
  }
};

export const NotificationsMenu = () => {
  const { notifications, unreadCount, markAllAsRead } =
    useNotificationsCenter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    markAllAsRead();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const recent = useMemo(() => notifications.slice(0, 8), [notifications]);

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen} size="large">
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        PaperProps={{ sx: { width: 320, maxHeight: 400 } }}
      >
        <Box px={2} py={1.5}>
          <Typography variant="subtitle1" fontWeight={600}>
            Notifications
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {notifications.length > 0
              ? `${notifications.length} notification(s) recues`
              : "Aucune notification pour le moment"}
          </Typography>
        </Box>
        <Divider />
        {recent.length === 0 ? (
          <MenuItem disabled>
            <ListItemText primary="Aucune notification disponible" />
          </MenuItem>
        ) : (
          recent.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={handleClose}
              sx={{ alignItems: "start" }}
            >
              <ListItemText
                primary={
                  notification.title || notification.message || "Notification"
                }
                secondary={
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {notification.message ||
                        "Consultez les details dans l'application."}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {formatTimestamp(notification.createdAt)}
                    </Typography>
                  </>
                }
              />
            </MenuItem>
          ))
        )}
        {notifications.length > recent.length ? (
          <>
            <Divider />
            <MenuItem disabled>
              <ListItemText primary="Afficher plus dans l'historique" />
            </MenuItem>
          </>
        ) : null}
      </Menu>
    </>
  );
};
