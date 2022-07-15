import { T_norm, S_norm } from './T-norm'

class Matrix {
    // Класс нечеткой матрицы (см. стр. 27)
    constructor(rows_count, columns_count, data) {
        // data — это массив строк (которые являются массивами чисел [-1, 1])
        // data must be shaped correctly
        this.rows_count = rows_count;
        this.columns_count = columns_count;
        this.data = data
    }
    
    // получить элемент с индексами i-j (нумерация с единицы)
    get(i, j) {
        return this.data[i-1][j-1]
    }

    // равенство 1)
    equal(B) {
        throw new Error('Method not implemented.');
    }

    // сложение 2) — max
    add(other) {
        let n = this.rows_count;
        let new_data = [];
        for (let i = 0; i < n; i++)
        {
            new_data[i] = []
            for (let j = 0; j < n; j++)
            {
                new_data[i][j] = S_norm(this.data[i][j], other.data[i][j]);
            }
        }
        return new Matrix(n, n, new_data);
    }
    // умножение на число 3)
    multiply_by_scalar(scalar) {
        // scalar in [0, 1]
        throw new Error('Method not implemented.');
    }


    // максминное умножение 4) — min
    multiply(other) {
        let n = this.rows_count;
        let new_data = [];
        for (let i = 0; i < n; i++)
        {
            new_data[i] = []
            for (let j = 0; j < n; j++)
            {
                let res = 0;
                for (let l = 0; l < n; l++)
                {
                    res = S_norm(res, T_norm(this.data[i][l], other.data[l][j]));
                }
                new_data[i][j] = res;
            }
        }
        return new Matrix(n, n, new_data);
    }
    // транспонирование 5)
    transpose() {
        throw new Error('Method not implemented.');
    }

    to_latex(format) {
        if (format == undefined) {
            format = el => Number(el).toFixed(2);
        }
        let n = this.rows_count;
        let res = "\\begin{bmatrix}\n";
        for (let i = 0; i < n; i++)
        {
            res += this.data[i].map(format).join(" & ")
            res += "\\\\\n";
        }
        res += "\\end{bmatrix}";
        return res;
    }

    // ugly
    static transpose(matrix) {
        return matrix[0].map((col, i) => matrix.map(row => row[i]));
    }

    // замыкание (стр. 30)

    // тензорное умножение
    multiply_tensor(other) {
        throw new Error('Method not implemented.');
    }

    // T-проиведение (триангулярная компазиция)
    multiply_T(other) {
        
    }

    // превый шаг алгоритма.
    toOddMap() {
        let n = this.rows_count;
        let data = [];
        let steps = "";
        steps += "A = "
        steps += this.to_latex();
        for (let i = 0; i < n*2; i++) {
            data[i] = [];
        }
        for (let i = 1; i < n + 1; i++) {
            for (let j = 1; j < n + 1; j++) {
                let x = this.data[i-1][j-1]
                if (x >= 0) {
                    data[2*i-1][2*j-1] = x;
                    data[2*i-1-1][2*j-1-1] = x;
                    data[2*i-1-1][2*j-1] = 0;
                    data[2*i-1][2*j-1-1] = 0;
                }
                else {
                    data[2*i-1][2*j-1] = 0;
                    data[2*i-1-1][2*j-1-1] = 0;
                    data[2*i-1-1][2*j-1] = -x;
                    data[2*i-1][2*j-1-1] = -x;
                }
            }
        }
        let res = new Matrix(n*2, n*2, data);
        steps += "→";
        steps += res.to_latex();
        steps += "= R";
        return {res, steps}
    }

    // нахождение транзитивного замыкания????
    transitive_closure() {
        let steps = String.raw`\begin{aligned}`;
        steps += String.raw`
&\text{По определению: } R^* = \vee_{i=1}^{\infty} R^i \\
&\text{Операция } \vee \text{ в данной задаче — это взятие покомпанентного максимума} \\
&\text{Возведение в степень } R^n = R^{n-1} \circ R \text{, где } A\circ B \text{— это макстриангулярная компазиция нечеткий матриц} \\
`;
        steps += String.raw`
\\
&\text{Нам нужно посчитать приблизительное знечение (с точностью до .01)} \\
`;
        let max_depth = 200;
        let n = this.rows_count;
        let res = new Matrix(n, n, this.data)
        let degree = this;
        let i = 0;
        while (i < max_depth) {
            degree = degree.multiply(this);
            if (i <= 2) {
                steps += String.raw`
&R^${i+1} = ${degree.to_latex()} \\
                `;
            } else if (i == 3) {
                steps += String.raw`
                … \\
`;
            }
            let toStop = true;
            for (let i = 0; i < n; i++)
            {
                for (let j = 0; j < n; j++)
                {
                    if (degree.data[i][j] >= 0.01) {
                        toStop = false;
                    }
                }
            }
            if (toStop) {
                steps += String.raw`
&\text{Для точности 0.01 достаточно остановиться на ${i+1} шаге, т.к. элементы } R^{${i+1}} \lt 0.01 \\
                `;
                break;
            }
            res = res.add(degree);
            i++;
        }
        if (i == max_depth) {
            steps += String.raw`
&\text{Для точности 0.01 достаточно остановиться на 200 шаге}\\
            `;
        }
        steps += String.raw`
&\text{Складывая получаем: } R^* = ${res.to_latex()} \\
        `;
        steps += String.raw`\end{aligned}`;
        return {res, steps};
    }

    // шаг 3 алгоритма
    positive_negative() {
        let steps = String.raw`\begin{aligned}`;
        let n = this.rows_count/2;
        let data = [];
        for (let i = 0; i < n; i++) {
            data[i] = [];
        }

        for (let i = 1; i < n + 1; i++) {
            for (let j = 1; j < n + 1; j++) {
                data[i-1][j-1] = [
                    Math.max(this.data[2*i-1-1][2*j-1-1], this.data[2*i-1][2*j-1]),                    
                    -Math.max(this.data[2*i-1][2*j-1-1], this.data[2*i-1-1][2*j-1]),
                ]
            }
        }
        let res = new Matrix(n, n, data);
        steps += String.raw`
&\text{По формулам: }\\
&v_{ij} = \max{\{r_{2i-1, 2j-1}, r_{2i, 2j}\}} \\
&\hat v_{ij} = -\max{\{r_{2i-1, 2j}, r_{2i-1, 2j}\}} \\
&\text{получаем матрицу:} \\
&V = ${res.to_latex(el => Number(el[0]).toFixed(2) + ", " + Number(el[1]).toFixed(2))}
        `;
        steps += String.raw`\end{aligned}`;
        return {res, steps};
    }

    // матрица косонанса
    get_consonans_matrix() {
        let steps = String.raw`\begin{aligned}`;
        let n = this.rows_count;
        let data = [];
        for (let i = 0; i < n; i++) {
            data[i] = [];
        }

        for (let i = 1; i < n + 1; i++) {
            for (let j = 1; j < n + 1; j++) {
                let a = this.data[i-1][j-1][0];
                let b = this.data[i-1][j-1][1];
                if (a == 0 && b == 0) {
                    data[i-1][j-1] = 0;
                }
                else {
                    data[i-1][j-1] = Math.abs(a + b)/(Math.abs(a) + Math.abs(b)); 
                }
            }
        }
        let res = new Matrix(n, n, data);
        steps += String.raw`
&\text{По формуле консонанса: }\\
&c_{ij} = \frac{|v_{ij}  + \hat v_{ij} |}{|v_{ij}| + |\hat v_{ij}|}\\
&\text{получаем матрицу консонанса:} \\
&C = ${res.to_latex()}
        `;
        steps += String.raw`\end{aligned}`;
        return {res, steps};
    }

    // матрица дисонанса
    get_disonans_matrix() {
        let steps = String.raw`\begin{aligned}`;
        let n = this.rows_count;
        let data = [];
        for (let i = 0; i < n; i++) {
            data[i] = [];
        }
        for (let i = 1; i < n + 1; i++) {
            for (let j = 1; j < n + 1; j++) {
                let a = this.data[i-1][j-1][0];
                let b = this.data[i-1][j-1][1];
                if (a == 0 && b == 0) {
                    data[i-1][j-1] = 1;
                }
                else {
                    data[i-1][j-1] = 1 - (Math.abs(a + b)/(Math.abs(a) + Math.abs(b)));
                }
            }
        }
        let res = new Matrix(n, n, data);
        steps += String.raw`
&\text{Элемент матрицы дисонасна выглядит как: }\\
&d_{ij} = 1 - c_{ij} \\
&\text{матрицу дисонанса:} \\
&D = ${res.to_latex()}
        `;
        steps += String.raw`\end{aligned}`;
        return {res, steps};
    }

    // матрица воздействия
    get_influence_matrix() {
        let steps = String.raw`\begin{aligned}`;
        let n = this.rows_count;
        let data = [];
        for (let i = 0; i < n; i++) {
            data[i] = [];
        }

        for (let i = 1; i < n + 1; i++) {
            for (let j = 1; j < n + 1; j++) {
                let a = this.data[i-1][j-1][0];
                let b = this.data[i-1][j-1][1];
                data[i-1][j-1] = Math.sign(a + b)*Math.max(Math.abs(a), Math.abs(b)); 
            }
        }
        let res = new Matrix(n, n, data);
        steps += String.raw`
&\text{Формула для элемента матрицы влияния }\\
&p_{ij} = sign(v_{ij}  + \hat v_{ij}) \max{\{|v_{ij}|, |\hat v_{ij}|\}} \\
&\text{матрицу влияния:} \\
&P = ${res.to_latex()}
        `;
        steps += String.raw`\end{aligned}`;
        return {res, steps};
    }

}

export default Matrix;