"""
Heat index classification and grid point labelling utilities.
"""

# Risk classification based on apparent temperature / heat index (°C)
RISK_LEVELS = [
    (54, {'level': 'CRITICAL', 'color': '#ff1744', 'label': 'Life-threatening'}),
    (46, {'level': 'EXTREME',  'color': '#ff6d00', 'label': 'Extreme danger'}),
    (41, {'level': 'HIGH',     'color': '#ffd600', 'label': 'Danger'}),
    (36, {'level': 'MODERATE', 'color': '#00e5aa', 'label': 'Caution'}),
    (0,  {'level': 'LOW',      'color': '#40c4ff', 'label': 'Safe'}),
]


def classify_risk(heat_index: float | None) -> dict:
    if heat_index is None:
        return {'level': 'UNKNOWN', 'color': '#888888', 'label': 'No data'}
    for threshold, risk in RISK_LEVELS:
        if heat_index >= threshold:
            return dict(risk)
    return {'level': 'LOW', 'color': '#40c4ff', 'label': 'Safe'}


# Maps (dy, dx) offset pair to a human-readable zone label
_LABELS = {
    (-0.10, -0.10): 'Far SW',   (-0.10, -0.05): 'SW',     (-0.10, 0.00): 'South',   (-0.10, 0.05): 'SE',     (-0.10, 0.10): 'Far SE',
    (-0.05, -0.10): 'W-SW',     (-0.05, -0.05): 'West',   (-0.05, 0.00): 'S-Center',(-0.05, 0.05): 'East',   (-0.05, 0.10): 'E-SE',
    ( 0.00, -0.10): 'Far West',  (0.00, -0.05): 'W-Center',(0.00,  0.00): 'Center',  ( 0.00, 0.05): 'E-Center',(0.00, 0.10): 'Far East',
    ( 0.05, -0.10): 'W-NW',     ( 0.05, -0.05): 'NW',    ( 0.05,  0.00): 'N-Center',( 0.05, 0.05): 'NE',     ( 0.05, 0.10): 'E-NE',
    ( 0.10, -0.10): 'Far NW',   ( 0.10, -0.05): 'N-NW',  ( 0.10,  0.00): 'North',   ( 0.10, 0.05): 'N-NE',   ( 0.10, 0.10): 'Far NE',
}


def label_grid_point(dy: float, dx: float) -> str:
    key = (round(dy, 2), round(dx, 2))
    return _LABELS.get(key, f'{dy:+.2f}°, {dx:+.2f}°')
