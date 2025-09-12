import CircularProgress from '@mui/material/CircularProgress';

export default function ScreenLoader() {
  return (
      <div className="listar__loading">
        <CircularProgress color="inherit" />
      </div>
  );
}
