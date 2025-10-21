import React from "react";

const RatingDistributionChart = ({ ratings }) => {
    // Calcular la distribución de calificaciones
    const calculateDistribution = () => {
        const distribution = {
        0.5: 0,
        1: 0,
        1.5: 0,
        2: 0,
        2.5: 0,
        3: 0,
        3.5: 0,
        4: 0,
        4.5: 0,
        5: 0,
        };

        ratings.forEach((rating) => {
        if (distribution.hasOwnProperty(rating.score)) {
            distribution[rating.score]++;
        }
        });

        return distribution;
    };

    const distribution = calculateDistribution();
    const totalRatings = ratings.length;
    const maxCount = Math.max(...Object.values(distribution));

    // Colores para cada barra (puedes personalizarlos)
    const getBarColor = (rating) => {
        const colors = {
        0.5: "#dc3545",
        1: "#e35d6a",
        1.5: "#ea868f",
        2: "#f1aeb5",
        2.5: "#f8d7da",
        3: "#ffc107",
        3.5: "#85cc9c",
        4: "#54b57c",
        4.5: "#2d9d5b",
        5: "#198754",
        };
        return colors[rating] || "#6c757d";
    };

    // Calcular estadísticas adicionales
    const calculateStats = () => {
        if (ratings.length === 0) return { average: 0, median: 0, mode: 0 };

        const scores = ratings.map((r) => r.score).sort((a, b) => a - b);
        const average = scores.reduce((a, b) => a + b, 0) / scores.length;

        // Mediana
        const mid = Math.floor(scores.length / 2);
        const median =
        scores.length % 2 !== 0
            ? scores[mid]
            : (scores[mid - 1] + scores[mid]) / 2;

        // Moda
        const frequency = {};
        let maxFreq = 0;
        let mode = scores[0];

        scores.forEach((score) => {
        frequency[score] = (frequency[score] || 0) + 1;
        if (frequency[score] > maxFreq) {
            maxFreq = frequency[score];
            mode = score;
        }
        });

        return { average, median, mode };
    };

    const stats = calculateStats();

    return (
        <div
        className="rating-distribution-chart p-4 rounded"
        style={{ backgroundColor: "#1e2328", border: "1px solid #454d5d" }}
        >
        <h4 className="text-light mb-4">Distribución de Calificaciones</h4>

        {totalRatings === 0 ? (
            <div className="text-center text-muted py-4">
            <p>No hay calificaciones para mostrar.</p>
            </div>
        ) : (
            <>
            {/* Estadísticas resumen */}
            <div className="row mb-4">
                <div className="col-md-4 text-center">
                <div className="stat-item">
                    <h5 className="text-warning mb-1">
                    {stats.average.toFixed(2)}
                    </h5>
                    <small className="text-muted">Promedio</small>
                </div>
                </div>
                <div className="col-md-4 text-center">
                <div className="stat-item">
                    <h5 className="text-info mb-1">{stats.median.toFixed(2)}</h5>
                    <small className="text-muted">Mediana</small>
                </div>
                </div>
                <div className="col-md-4 text-center">
                <div className="stat-item">
                    <h5 className="text-success mb-1">{stats.mode.toFixed(2)}</h5>
                    <small className="text-muted">Moda</small>
                </div>
                </div>
            </div>

            {/* Gráfico de barras */}
            <div className="chart-container">
                {Object.entries(distribution).map(([rating, count]) => {
                const percentage =
                    totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                const barHeight = maxCount > 0 ? (count / maxCount) * 100 : 0;

                return (
                    <div key={rating} className="bar-item mb-3">
                    <div className="d-flex align-items-center">
                        <div
                        className="rating-label me-3"
                        style={{ width: "30px" }}
                        >
                        <span className="text-light small">{rating}★</span>
                        </div>
                        <div
                        className="bar flex-grow-1 position-relative"
                        style={{
                            height: "24px",
                            backgroundColor: "#2c3440",
                            borderRadius: "4px",
                            overflow: "hidden",
                            cursor: "pointer",
                        }}
                        title={`${count} películas (${percentage.toFixed(1)}%)`}
                        >
                        <div
                            className="bar-fill h-100"
                            style={{
                            width: `${barHeight}%`,
                            backgroundColor: getBarColor(parseFloat(rating)),
                            transition: "width 0.3s ease",
                            }}
                        ></div>
                        <div className="position-absolute top-0 start-0 h-100 d-flex align-items-center ps-2">
                            <span
                            className="count-text"
                            style={{
                                fontSize: "12px",
                                color: count > 0 ? "#fff" : "transparent",
                                fontWeight: "bold",
                                textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
                            }}
                            >
                            {count}
                            </span>
                        </div>
                        </div>
                        <div
                        className="percentage-label ms-3"
                        style={{ width: "50px" }}
                        >
                        <span className="text-muted small">
                            {percentage.toFixed(1)}%
                        </span>
                        </div>
                    </div>
                    </div>
                );
                })}
            </div>

            {/* Resumen total */}
            <div className="mt-4 pt-3 border-top border-secondary">
                <div className="d-flex justify-content-between align-items-center">
                <span className="text-light">Total de calificaciones:</span>
                <span className="text-warning fw-bold">{totalRatings}</span>
                </div>
            </div>
            </>
        )}
        </div>
    );
};

export default RatingDistributionChart;
